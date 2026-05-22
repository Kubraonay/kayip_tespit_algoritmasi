import path from "path";
import fs from "fs";

export function getUploadDir(gorevId: number) {
  const dir = path.join(process.cwd(), "data", "uploads", "saha", String(gorevId));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}
