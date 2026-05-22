import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { getDb } from "@/lib/db";
import { sahaGorevleri, sahaGorevFotograflari } from "@/lib/db/schema";
import { getUploadDir } from "@/lib/saha/upload";
import { kayitIslemLog } from "@/lib/audit/log";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const db = getDb();
  const [gorev] = await db
    .select()
    .from(sahaGorevleri)
    .where(eq(sahaGorevleri.paylasimToken, token))
    .limit(1);

  if (!gorev) {
    return NextResponse.json({ error: "Geçersiz görev" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const aciklama = String(formData.get("aciklama") ?? "");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Sadece JPEG/PNG/WebP" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Max 5 MB" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const dir = getUploadDir(gorev.id);
  const fullPath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(fullPath, buffer);

  const relPath = `saha/${gorev.id}/${filename}`;
  await db.insert(sahaGorevFotograflari).values({
    gorevId: gorev.id,
    dosyaYolu: relPath,
    aciklama: aciklama || null,
    kaynak: "saha",
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, path: relPath });
}
