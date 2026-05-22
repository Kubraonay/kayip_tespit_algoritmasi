import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rel = searchParams.get("path");
  if (!rel || rel.includes("..")) {
    return NextResponse.json({ error: "Geçersiz path" }, { status: 400 });
  }

  const full = path.join(process.cwd(), "data", "uploads", rel);
  if (!fs.existsSync(full)) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const buf = fs.readFileSync(full);
  const ext = path.extname(full).toLowerCase();
  const type =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  return new NextResponse(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
