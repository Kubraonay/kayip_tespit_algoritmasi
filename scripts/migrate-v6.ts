import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLE_PERMISSIONS } from "../lib/auth/permissions";
import type { UserRole } from "../lib/db/schema";

const dbPath = path.join(process.cwd(), "data", "app.db");
const sqlite = new Database(dbPath);

const userCols = sqlite
  .prepare("PRAGMA table_info(users)")
  .all() as { name: string }[];

if (!userCols.some((c) => c.name === "aktif")) {
  sqlite.exec(`ALTER TABLE users ADD COLUMN aktif INTEGER NOT NULL DEFAULT 1`);
}
if (!userCols.some((c) => c.name === "son_giris_at")) {
  sqlite.exec(`ALTER TABLE users ADD COLUMN son_giris_at INTEGER`);
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS rol_yetkileri (
    rol TEXT NOT NULL,
    yetki TEXT NOT NULL,
    aktif INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (rol, yetki)
  );
`);

sqlite.prepare(`UPDATE users SET rol = 'operator' WHERE rol = 'muhendis'`).run();

const insertPerm = sqlite.prepare(
  `INSERT OR IGNORE INTO rol_yetkileri (rol, yetki, aktif) VALUES (?, ?, 1)`
);

const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS) as UserRole[];
for (const rol of roles) {
  for (const yetki of DEFAULT_ROLE_PERMISSIONS[rol]) {
    insertPerm.run(rol, yetki);
  }
}

const demoUsers = [
  {
    email: "yonetici@akdeniz.local",
    adSoyad: "Demo Yönetici",
    rol: "yonetici",
    password: "yonetici123",
  },
  {
    email: "operator@akdeniz.local",
    adSoyad: "Demo Operatör",
    rol: "operator",
    password: "operator123",
  },
  {
    email: "saha@akdeniz.local",
    adSoyad: "Demo Saha Personeli",
    rol: "saha_personeli",
    password: "saha12345",
  },
  {
    email: "izleyici@akdeniz.local",
    adSoyad: "Demo İzleyici",
    rol: "izleyici",
    password: "izleyici123",
  },
];

const now = Date.now();
const insertUser = sqlite.prepare(
  `INSERT OR IGNORE INTO users (email, password_hash, ad_soyad, rol, aktif, created_at)
   VALUES (?, ?, ?, ?, 1, ?)`
);

for (const u of demoUsers) {
  const hash = bcrypt.hashSync(u.password, 10);
  insertUser.run(u.email, hash, u.adSoyad, u.rol, now);
}

console.log("Migrate v6: RBAC tabloları, rol migrasyonu ve demo kullanıcılar hazır");
console.log("Demo hesaplar: yonetici@ / operator@ / saha@ / izleyici@ (şifreler plan dokümanında)");
