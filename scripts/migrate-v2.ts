import Database from "better-sqlite3";
import path from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { generateHourlyFromMonthly } from "../lib/kayip-kacak/hourly-profile";

const dbPath = path.join(process.cwd(), "data", "app.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

const centers: Record<string, { lat: number; lng: number }> = {
  "TM-ANT-01": { lat: 36.8841, lng: 30.7056 },
  "TM-ALN-02": { lat: 36.5449, lng: 31.9997 },
};

function migrate() {
  const cols = sqlite
    .prepare("PRAGMA table_info(aboneler)")
    .all() as { name: string }[];
  if (!cols.some((c) => c.name === "enlem")) {
    sqlite.exec(`ALTER TABLE aboneler ADD COLUMN enlem REAL`);
    sqlite.exec(`ALTER TABLE aboneler ADD COLUMN boylam REAL`);
    console.log("aboneler: enlem, boylam eklendi");
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS saatlik_tuketim (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sayac_id INTEGER NOT NULL REFERENCES sayaclar(id) ON DELETE CASCADE,
      yil INTEGER NOT NULL,
      ay INTEGER NOT NULL,
      gun INTEGER NOT NULL DEFAULT 15,
      saat INTEGER NOT NULL,
      aktif_kwh REAL NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(sayac_id, yil, ay, gun, saat)
    );
    CREATE TABLE IF NOT EXISTS kacak_tespitleri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      abone_id INTEGER NOT NULL REFERENCES aboneler(id) ON DELETE CASCADE,
      analiz_id INTEGER REFERENCES kayip_analizleri(id) ON DELETE SET NULL,
      donem TEXT NOT NULL,
      kacak_tipi TEXT NOT NULL,
      durum TEXT NOT NULL,
      guven_skoru REAL NOT NULL DEFAULT 70,
      tahmini_kayip_kwh REAL,
      ispatlar TEXT NOT NULL,
      anlatim TEXT NOT NULL,
      muhendis_yorumu TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  console.log("Yeni tablolar hazır");
}

async function seedCoordsAndHourly() {
  const trafolar = await db.select().from(schema.trafoMerkezleri);
  const aboneList = await db.select().from(schema.aboneler);

  for (const abone of aboneList) {
    const trafo = trafolar.find((t) => t.id === abone.trafoId);
    const center = trafo ? centers[trafo.kod] : centers["TM-ANT-01"];
    const enlem = center.lat + (Math.random() - 0.5) * 0.08;
    const boylam = center.lng + (Math.random() - 0.5) * 0.08;
    await db
      .update(schema.aboneler)
      .set({ enlem, boylam })
      .where(eq(schema.aboneler.id, abone.id));
  }

  const sayaclar = await db
    .select()
    .from(schema.sayaclar)
    .where(eq(schema.sayaclar.tip, "abone"));

  const existingHourly = sqlite
    .prepare("SELECT COUNT(*) as c FROM saatlik_tuketim")
    .get() as { c: number };

  if (existingHourly.c === 0) {
  for (const sayac of sayaclar) {
    const [monthly] = await db
      .select()
      .from(schema.aylikTuketim)
      .where(
        eq(schema.aylikTuketim.sayacId, sayac.id)
      );
    const abone = aboneList.find((a) => a.id === sayac.aboneId);
    const monthlyKwh = monthly?.aktifKwh ?? 400;
    const hourly = generateHourlyFromMonthly(
      monthlyKwh,
      abone?.tarifeGrubu ?? "mesken"
    );
    const rows = hourly.map((h) => ({
      sayacId: sayac.id,
      yil: 2025,
      ay: 12,
      gun: 15,
      saat: h.saat,
      aktifKwh: h.kwh,
    }));
    for (let i = 0; i < rows.length; i += 8) {
      await db
        .insert(schema.saatlikTuketim)
        .values(rows.slice(i, i + 8));
    }
  }
  }

  const aboneSayaclar = await db
    .select()
    .from(schema.sayaclar)
    .where(eq(schema.sayaclar.tip, "abone"))
    .limit(6);
  for (const s of aboneSayaclar) {
    const rows = await db
      .select()
      .from(schema.aylikTuketim)
      .where(eq(schema.aylikTuketim.sayacId, s.id));
    const past = rows.filter((r) => !(r.yil === 2025 && r.ay === 12));
    const avg =
      past.length > 0
        ? past.reduce((a, r) => a + r.aktifKwh, 0) / past.length
        : 500;
    const dec = rows.find((r) => r.yil === 2025 && r.ay === 12);
    if (dec) {
      await db
        .update(schema.aylikTuketim)
        .set({ aktifKwh: Math.round(avg * 2.2) })
        .where(eq(schema.aylikTuketim.id, dec.id));
    }
  }
  console.log("Koordinatlar, saatlik profiller ve örnek anomali tüketim güncellendi");
}

migrate();
seedCoordsAndHourly()
  .then(() => {
    console.log("Migrate v2 tamam");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
