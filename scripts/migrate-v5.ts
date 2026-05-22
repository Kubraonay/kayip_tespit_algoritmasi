import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "app.db");
const sqlite = new Database(dbPath);
const now = Date.now();

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS alarmlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tip TEXT NOT NULL,
    seviye TEXT NOT NULL,
    baslik TEXT NOT NULL,
    aciklama TEXT NOT NULL,
    detay TEXT,
    abone_id INTEGER REFERENCES aboneler(id) ON DELETE SET NULL,
    sayac_id INTEGER REFERENCES sayaclar(id) ON DELETE SET NULL,
    abone_no TEXT,
    sayac_seri TEXT,
    durum TEXT NOT NULL DEFAULT 'aktif',
    okundu INTEGER NOT NULL DEFAULT 0,
    cozulme_at INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS alarm_bildirim_loglari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id INTEGER NOT NULL REFERENCES alarmlar(id) ON DELETE CASCADE,
    kullanici_id INTEGER REFERENCES users(id),
    kanal TEXT NOT NULL,
    alici TEXT,
    durum TEXT NOT NULL DEFAULT 'beklemede',
    mesaj TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS kullanici_bildirim_ayarlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_aktif INTEGER NOT NULL DEFAULT 1,
    sms_aktif INTEGER NOT NULL DEFAULT 0,
    push_aktif INTEGER NOT NULL DEFAULT 1,
    telefon TEXT,
    push_endpoint TEXT,
    created_at INTEGER NOT NULL
  );
`);

const alarmCount = sqlite
  .prepare("SELECT COUNT(*) as c FROM alarmlar")
  .get() as { c: number };

if (alarmCount.c === 0) {
  console.log("Örnek alarmlar için scan çalıştırılıyor...");
}

console.log("Migrate v5: Alarm & Bildirim tabloları hazır");
