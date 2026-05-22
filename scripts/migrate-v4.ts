import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "app.db");
const sqlite = new Database(dbPath);
const now = Date.now();

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS saha_ekipleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kod TEXT NOT NULL UNIQUE,
    ad TEXT NOT NULL,
    bolge TEXT,
    trafo_id INTEGER REFERENCES trafo_merkezleri(id) ON DELETE SET NULL,
    aktif INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saha_personelleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sicil_no TEXT NOT NULL UNIQUE,
    ad_soyad TEXT NOT NULL,
    telefon TEXT,
    ekip_id INTEGER REFERENCES saha_ekipleri(id) ON DELETE SET NULL,
    unvan TEXT DEFAULT 'saha_teknisyeni',
    aktif INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saha_gorevleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kacak_tespit_id INTEGER REFERENCES kacak_tespitleri(id) ON DELETE SET NULL,
    abone_id INTEGER NOT NULL REFERENCES aboneler(id) ON DELETE CASCADE,
    ekip_id INTEGER NOT NULL REFERENCES saha_ekipleri(id),
    atanan_personel_id INTEGER REFERENCES saha_personelleri(id) ON DELETE SET NULL,
    durum TEXT NOT NULL DEFAULT 'beklemede',
    oncelik TEXT NOT NULL DEFAULT 'normal',
    planlanan_tarih INTEGER,
    hedef_enlem REAL,
    hedef_boylam REAL,
    paylasim_token TEXT NOT NULL UNIQUE,
    created_by INTEGER REFERENCES users(id),
    baslangic_at INTEGER,
    bitis_at INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saha_gorev_durum_gecmisi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gorev_id INTEGER NOT NULL REFERENCES saha_gorevleri(id) ON DELETE CASCADE,
    durum TEXT NOT NULL,
    not_metni TEXT,
    kullanici_id INTEGER REFERENCES users(id),
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saha_gorev_notlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gorev_id INTEGER NOT NULL REFERENCES saha_gorevleri(id) ON DELETE CASCADE,
    kullanici_id INTEGER REFERENCES users(id),
    kaynak TEXT NOT NULL DEFAULT 'merkez',
    icerik TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saha_gorev_fotograflari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gorev_id INTEGER NOT NULL REFERENCES saha_gorevleri(id) ON DELETE CASCADE,
    dosya_yolu TEXT NOT NULL,
    aciklama TEXT,
    kaynak TEXT NOT NULL DEFAULT 'saha',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saha_tutanaklari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gorev_id INTEGER NOT NULL UNIQUE REFERENCES saha_gorevleri(id) ON DELETE CASCADE,
    icerik TEXT NOT NULL,
    imzalayan TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saha_konumlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personel_id INTEGER NOT NULL REFERENCES saha_personelleri(id) ON DELETE CASCADE,
    gorev_id INTEGER REFERENCES saha_gorevleri(id) ON DELETE SET NULL,
    enlem REAL NOT NULL,
    boylam REAL NOT NULL,
    kaynak TEXT NOT NULL DEFAULT 'gps',
    created_at INTEGER NOT NULL
  );
`);

const ekipCount = sqlite
  .prepare("SELECT COUNT(*) as c FROM saha_ekipleri")
  .get() as { c: number };

if (ekipCount.c === 0) {
  const trafo = sqlite
    .prepare("SELECT id FROM trafo_merkezleri LIMIT 1")
    .get() as { id: number } | undefined;

  sqlite
    .prepare(
      `INSERT INTO saha_ekipleri (kod, ad, bolge, trafo_id, aktif, created_at) VALUES (?, ?, ?, ?, 1, ?)`
    )
    .run("EKP-01", "Antalya Saha Ekibi A", "Muratpaşa", trafo?.id ?? null, now);
  sqlite
    .prepare(
      `INSERT INTO saha_ekipleri (kod, ad, bolge, trafo_id, aktif, created_at) VALUES (?, ?, ?, ?, 1, ?)`
    )
    .run("EKP-02", "Alanya Saha Ekibi B", "Alanya", trafo?.id ?? null, now);

  const ekip1 = sqlite
    .prepare("SELECT id FROM saha_ekipleri WHERE kod = 'EKP-01'")
    .get() as { id: number };
  const ekip2 = sqlite
    .prepare("SELECT id FROM saha_ekipleri WHERE kod = 'EKP-02'")
    .get() as { id: number };

  const personeller = [
    ["P-1001", "Murat Kılıç", "05321110001", ekip1.id, "ekip_lideri"],
    ["P-1002", "Serkan Yıldız", "05321110002", ekip1.id, "saha_teknisyeni"],
    ["P-2001", "Emre Aktaş", "05321120001", ekip2.id, "ekip_lideri"],
    ["P-2002", "Can Özdemir", "05321120002", ekip2.id, "saha_teknisyeni"],
  ] as const;

  const insPersonel = sqlite.prepare(
    `INSERT INTO saha_personelleri (sicil_no, ad_soyad, telefon, ekip_id, unvan, aktif, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  );
  for (const p of personeller) {
    insPersonel.run(p[0], p[1], p[2], p[3], p[4], now);
  }

  const kacak = sqlite
    .prepare(
      `SELECT k.id as kacakId, k.abone_id as aboneId, a.enlem, a.boylam
       FROM kacak_tespitleri k
       INNER JOIN aboneler a ON a.id = k.abone_id
       LIMIT 3`
    )
    .all() as {
    kacakId: number;
    aboneId: number;
    enlem: number | null;
    boylam: number | null;
  }[];

  if (kacak.length > 0) {
    const admin = sqlite
      .prepare("SELECT id FROM users LIMIT 1")
      .get() as { id: number } | undefined;
    const p1 = sqlite
      .prepare("SELECT id FROM saha_personelleri WHERE sicil_no = 'P-1001'")
      .get() as { id: number };
    const p2 = sqlite
      .prepare("SELECT id FROM saha_personelleri WHERE sicil_no = 'P-2001'")
      .get() as { id: number };

    const durumlar = ["atandi", "yola_cikildi", "sahada"] as const;
    const insGorev = sqlite.prepare(
      `INSERT INTO saha_gorevleri (
        kacak_tespit_id, abone_id, ekip_id, atanan_personel_id, durum, oncelik,
        planlanan_tarih, hedef_enlem, hedef_boylam, paylasim_token, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, 'yuksek', ?, ?, ?, ?, ?, ?)`
    );
    const insDurum = sqlite.prepare(
      `INSERT INTO saha_gorev_durum_gecmisi (gorev_id, durum, not_metni, created_at) VALUES (?, ?, ?, ?)`
    );
    const insKonum = sqlite.prepare(
      `INSERT INTO saha_konumlari (personel_id, gorev_id, enlem, boylam, kaynak, created_at)
       VALUES (?, ?, ?, ?, 'simulasyon', ?)`
    );

    kacak.forEach((k, i) => {
      const token = randomBytes(16).toString("hex");
      const ekipId = i % 2 === 0 ? ekip1.id : ekip2.id;
      const personelId = i % 2 === 0 ? p1.id : p2.id;
      const durum = durumlar[i] ?? "atandi";
      const enlem = k.enlem ?? 36.88 + i * 0.01;
      const boylam = k.boylam ?? 30.7 + i * 0.01;
      const r = insGorev.run(
        k.kacakId,
        k.aboneId,
        ekipId,
        personelId,
        durum,
        now,
        enlem,
        boylam,
        token,
        admin?.id ?? null,
        now
      );
      const gorevId = Number(r.lastInsertRowid);
      insDurum.run(gorevId, "beklemede", "Görev oluşturuldu", now);
      insDurum.run(gorevId, durum, "Örnek seed durumu", now);
      insKonum.run(
        personelId,
        gorevId,
        enlem + 0.002,
        boylam + 0.002,
        now
      );
      console.log(`Örnek görev #${gorevId} token: ${token}`);
    });
  }
}

const uploadsDir = path.join(process.cwd(), "data", "uploads", "saha");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log("Migrate v4: Saha Operasyonları tabloları hazır");
