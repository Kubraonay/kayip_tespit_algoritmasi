import { cache } from "react";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { rolYetkileri, type UserRole } from "@/lib/db/schema";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  normalizeUserRole,
  type PermissionKey,
} from "@/lib/auth/permissions";

export const getRolePermissions = cache(
  async (role: string): Promise<PermissionKey[]> => {
    const normalized = normalizeUserRole(role) ?? role;
    const db = getDb();
    const rows = await db
      .select({ yetki: rolYetkileri.yetki })
      .from(rolYetkileri)
      .where(
        and(eq(rolYetkileri.rol, normalized), eq(rolYetkileri.aktif, true))
      );

    if (rows.length === 0) {
      const defaults = DEFAULT_ROLE_PERMISSIONS[normalized as UserRole];
      if (defaults) return defaults;
      return [];
    }

    return rows.map((r) => r.yetki as PermissionKey);
  }
);

export async function hasPermission(
  role: string | undefined,
  permission: PermissionKey
): Promise<boolean> {
  if (!role) return false;
  const normalized = normalizeUserRole(role);
  if (!normalized) return false;
  const perms = await getRolePermissions(normalized);
  return perms.includes(permission);
}

export async function getAllRolePermissionsMatrix(): Promise<
  Record<UserRole, Record<PermissionKey, boolean>>
> {
  const db = getDb();
  const rows = await db.select().from(rolYetkileri);
  const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS) as UserRole[];
  const matrix = {} as Record<UserRole, Record<PermissionKey, boolean>>;

  for (const rol of roles) {
    matrix[rol] = {} as Record<PermissionKey, boolean>;
    for (const yetki of ALL_PERMISSIONS) {
      const row = rows.find((r) => r.rol === rol && r.yetki === yetki);
      if (row) {
        matrix[rol][yetki] = row.aktif;
      } else {
        matrix[rol][yetki] = DEFAULT_ROLE_PERMISSIONS[rol].includes(yetki);
      }
    }
  }
  return matrix;
}

export async function seedDefaultRolePermissions(): Promise<void> {
  const db = getDb();
  const roles = Object.keys(DEFAULT_ROLE_PERMISSIONS) as UserRole[];
  for (const rol of roles) {
    for (const yetki of DEFAULT_ROLE_PERMISSIONS[rol]) {
      await db
        .insert(rolYetkileri)
        .values({ rol, yetki, aktif: true })
        .onConflictDoNothing();
    }
  }
}
