import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { authConfig } from "./auth.config";
import { normalizeUserRole } from "@/lib/auth/permissions";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        let role = token.role as string | undefined;
        if (token.id) {
          const db = getDb();
          const [row] = await db
            .select({ rol: users.rol })
            .from(users)
            .where(eq(users.id, Number(token.id)))
            .limit(1);
          if (row?.rol) {
            role = normalizeUserRole(row.rol) ?? row.rol;
          }
        }
        (session.user as { role?: string }).role =
          normalizeUserRole(role) ?? role;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email || !credentials?.password) return null;
        const db = getDb();
        const { kayitIslemLog } = await import("@/lib/audit/log");
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!user) {
          await kayitIslemLog({
            islemTipi: "giris_basarisiz",
            aciklama: "Bilinmeyen e-posta ile giriş denemesi",
            detay: JSON.stringify({ email: email.replace(/(.{2}).*(@.*)/, "$1***$2") }),
          });
          return null;
        }
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) {
          await kayitIslemLog({
            kullaniciId: user.id,
            kullaniciAd: user.adSoyad,
            islemTipi: "giris_basarisiz",
            aciklama: `Hatalı şifre: ${user.adSoyad}`,
            detay: JSON.stringify({ email: user.email }),
          });
          return null;
        }
        if (user.aktif === false) {
          await kayitIslemLog({
            kullaniciId: user.id,
            kullaniciAd: user.adSoyad,
            islemTipi: "giris_basarisiz",
            aciklama: `Pasif hesap giriş denemesi: ${user.adSoyad}`,
          });
          return null;
        }
        await db
          .update(users)
          .set({ sonGirisAt: new Date() })
          .where(eq(users.id, user.id));
        await kayitIslemLog({
          kullaniciId: user.id,
          kullaniciAd: user.adSoyad,
          islemTipi: "giris_yapildi",
          aciklama: `${user.adSoyad} sisteme giriş yaptı`,
          detay: JSON.stringify({ email: user.email, rol: user.rol }),
        });
        return {
          id: String(user.id),
          email: user.email,
          name: user.adSoyad,
          role: normalizeUserRole(user.rol) ?? user.rol,
        };
      },
    }),
  ],
});
