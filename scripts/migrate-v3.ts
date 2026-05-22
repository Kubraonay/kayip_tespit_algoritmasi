import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "app.db");
const sqlite = new Database(dbPath);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS kacak_notlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kacak_tespit_id INTEGER NOT NULL REFERENCES kacak_tespitleri(id) ON DELETE CASCADE,
    kullanici_id INTEGER NOT NULL REFERENCES users(id),
    icerik TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS islem_loglari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_id INTEGER REFERENCES users(id),
    kullanici_ad TEXT,
    islem_tipi TEXT NOT NULL,
    varlik_tipi TEXT,
    varlik_id INTEGER,
    aciklama TEXT NOT NULL,
    detay TEXT,
    created_at INTEGER NOT NULL
  );
`);

console.log("Migrate v3: kacak_notlari ve islem_loglari tabloları hazır");
