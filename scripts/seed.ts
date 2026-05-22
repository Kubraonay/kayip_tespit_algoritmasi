import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/db/schema";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "app.db");
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    ad_soyad TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'muhendis',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS trafo_merkezleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kod TEXT NOT NULL UNIQUE,
    ad TEXT NOT NULL,
    ilce TEXT,
    kapasite_kva REAL NOT NULL DEFAULT 400,
    gerilim_kv REAL NOT NULL DEFAULT 15.8,
    pb_kw REAL,
    pcu_kw REAL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fiderler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trafo_id INTEGER NOT NULL REFERENCES trafo_merkezleri(id) ON DELETE CASCADE,
    kod TEXT NOT NULL,
    ad TEXT NOT NULL,
    hat_uzunluk_m REAL DEFAULT 500,
    kesit_mm2 REAL DEFAULT 95,
    gerilim_kv REAL DEFAULT 0.4,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS aboneler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    abone_no TEXT NOT NULL UNIQUE,
    ad TEXT NOT NULL,
    soyad TEXT NOT NULL,
    adres TEXT,
    trafo_id INTEGER REFERENCES trafo_merkezleri(id),
    fider_id INTEGER REFERENCES fiderler(id),
    tarife_grubu TEXT DEFAULT 'mesken',
    durum TEXT NOT NULL DEFAULT 'aktif',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sayaclar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seri_no TEXT NOT NULL UNIQUE,
    tip TEXT NOT NULL,
    abone_id INTEGER REFERENCES aboneler(id) ON DELETE SET NULL,
    trafo_id INTEGER REFERENCES trafo_merkezleri(id) ON DELETE SET NULL,
    fider_id INTEGER REFERENCES fiderler(id) ON DELETE SET NULL,
    marka TEXT,
    faz INTEGER DEFAULT 3,
    hane INTEGER DEFAULT 6,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS aylik_tuketim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sayac_id INTEGER NOT NULL REFERENCES sayaclar(id) ON DELETE CASCADE,
    yil INTEGER NOT NULL,
    ay INTEGER NOT NULL,
    aktif_kwh REAL NOT NULL,
    reaktif_kvarh REAL,
    endeks REAL,
    created_at INTEGER NOT NULL,
    UNIQUE(sayac_id, yil, ay)
  );
  CREATE TABLE IF NOT EXISTS kayip_analizleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seviye TEXT NOT NULL,
    referans_id INTEGER,
    donem TEXT NOT NULL,
    e_giris REAL,
    e_cikis REAL,
    e_abone_toplam REAL,
    e_teknik REAL,
    e_teknik_olmayan REAL,
    oran_yuzde REAL,
    durum TEXT NOT NULL DEFAULT 'normal',
    aciklama TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS import_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dosya TEXT NOT NULL,
    tip TEXT NOT NULL,
    satir_sayisi INTEGER DEFAULT 0,
    basarili INTEGER DEFAULT 0,
    hatalar TEXT,
    kullanici_id INTEGER REFERENCES users(id),
    created_at INTEGER NOT NULL
  );
`);

const db = drizzle(sqlite, { schema });
const now = new Date();

async function seed() {
  const hash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    10
  );
  await db.insert(schema.users).values({
    email: process.env.ADMIN_EMAIL || "admin@akdeniz.local",
    passwordHash: hash,
    adSoyad: "Sistem Yöneticisi",
    rol: "admin",
    createdAt: now,
  });

  await db.insert(schema.settings).values([
    { key: "hedef_kayip_orani", value: "12" },
    { key: "anomali_esik_yuzde", value: "40" },
    { key: "min_abone_sayisi", value: "3" },
  ]);

  const trafolar = await db
    .insert(schema.trafoMerkezleri)
    .values([
      {
        kod: "TM-ANT-01",
        ad: "Antalya Merkez TM",
        ilce: "Muratpaşa",
        kapasiteKva: 630,
        gerilimKv: 15.8,
        createdAt: now,
      },
      {
        kod: "TM-ALN-02",
        ad: "Alanya Batı TM",
        ilce: "Alanya",
        kapasiteKva: 400,
        gerilimKv: 15.8,
        createdAt: now,
      },
    ])
    .returning();

  const fiderData: (typeof schema.fiderler.$inferInsert)[] = [];
  for (const trafo of trafolar) {
    fiderData.push(
      {
        trafoId: trafo.id,
        kod: "F1",
        ad: `${trafo.ad} Fider 1`,
        hatUzunlukM: 420,
        kesitMm2: 95,
        createdAt: now,
      },
      {
        trafoId: trafo.id,
        kod: "F2",
        ad: `${trafo.ad} Fider 2`,
        hatUzunlukM: 680,
        kesitMm2: 120,
        createdAt: now,
      }
    );
  }
  const fiderler = await db.insert(schema.fiderler).values(fiderData).returning();

  const aboneNames = [
    ["Ahmet", "Yılmaz"],
    ["Fatma", "Kaya"],
    ["Mehmet", "Demir"],
    ["Ayşe", "Çelik"],
    ["Ali", "Şahin"],
    ["Zeynep", "Arslan"],
    ["Mustafa", "Öztürk"],
    ["Elif", "Aydın"],
    ["Hasan", "Koç"],
    ["Merve", "Polat"],
  ];

  let aboneIdx = 1;
  const aboneler: (typeof schema.aboneler.$inferInsert)[] = [];
  for (const fider of fiderler) {
    for (let i = 0; i < 5; i++) {
      const [ad, soyad] = aboneNames[(aboneIdx - 1) % aboneNames.length];
      aboneler.push({
        aboneNo: `ABN-${String(aboneIdx).padStart(5, "0")}`,
        ad,
        soyad,
        adres: `${fider.ad} Mah. No:${aboneIdx}`,
        trafoId: fider.trafoId,
        fiderId: fider.id,
        tarifeGrubu: i % 3 === 0 ? "sanayi" : "mesken",
        durum: "aktif",
        createdAt: now,
      });
      aboneIdx++;
    }
  }
  const insertedAboneler = await db
    .insert(schema.aboneler)
    .values(aboneler)
    .returning();

  const sayacRows: (typeof schema.sayaclar.$inferInsert)[] = [];
  for (const trafo of trafolar) {
    sayacRows.push({
      seriNo: `TRF-GIR-${trafo.kod}`,
      tip: "trafo_giris",
      trafoId: trafo.id,
      marka: "Landis",
      createdAt: now,
    });
  }
  for (const fider of fiderler) {
    sayacRows.push({
      seriNo: `FID-GIR-${fider.id}`,
      tip: "fider_giris",
      fiderId: fider.id,
      trafoId: fider.trafoId,
      marka: "Landis",
      createdAt: now,
    });
  }
  for (const abone of insertedAboneler) {
    sayacRows.push({
      seriNo: `SYC-${abone.aboneNo}`,
      tip: "abone",
      aboneId: abone.id,
      fiderId: abone.fiderId,
      trafoId: abone.trafoId,
      marka: "Elster",
      createdAt: now,
    });
  }
  const sayaclar = await db.insert(schema.sayaclar).values(sayacRows).returning();

  const months = [
    { yil: 2025, ay: 10 },
    { yil: 2025, ay: 11 },
    { yil: 2025, ay: 12 },
  ];
  const tuketimRows: (typeof schema.aylikTuketim.$inferInsert)[] = [];

  for (const sayac of sayaclar) {
    let base = 0;
    if (sayac.tip === "trafo_giris") base = 85000;
    else if (sayac.tip === "fider_giris") base = 42000;
    else base = 350 + Math.random() * 800;

    for (const { yil, ay } of months) {
      const factor = 0.95 + Math.random() * 0.15;
      const kwh =
        sayac.tip === "abone"
          ? Math.round(base * factor)
          : Math.round(base * factor * (sayac.tip === "trafo_giris" ? 1 : 0.5));
      tuketimRows.push({
        sayacId: sayac.id,
        yil,
        ay,
        aktifKwh: kwh,
        createdAt: now,
      });
    }
  }
  await db.insert(schema.aylikTuketim).values(tuketimRows);

  const { runFullAnalysis } = await import("../lib/kayip-kacak/run-analysis");
  const analiz = await runFullAnalysis(2025, 12);
  console.log("Analiz:", analiz);

  console.log("Seed tamamlandı.");
  console.log("Admin:", process.env.ADMIN_EMAIL || "admin@akdeniz.local");
  console.log("Şifre:", process.env.ADMIN_PASSWORD || "admin123");
}

seed().catch(console.error);
