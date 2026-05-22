import { randomBytes } from "crypto";

export function generateGorevToken(): string {
  return randomBytes(16).toString("hex");
}

export const SAHA_FIELD_DURUMLAR = ["yola_cikildi", "sahada", "inceleme"] as const;

export function canFieldUpdateStatus(durum: string): boolean {
  return (SAHA_FIELD_DURUMLAR as readonly string[]).includes(durum);
}
