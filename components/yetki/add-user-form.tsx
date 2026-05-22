"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/actions/rbac";
import { USER_ROLES, type UserRole } from "@/lib/db/schema";
import { ROL_LABELS } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddUserForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const res = await createUser(new FormData(form));
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      form.reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Input name="adSoyad" placeholder="Ad Soyad" required />
      <Input name="email" type="email" placeholder="E-posta" required />
      <Input name="password" type="password" placeholder="Şifre (min 8)" required minLength={8} />
      <select
        name="rol"
        defaultValue="operator"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        {USER_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROL_LABELS[r as UserRole]}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <Button type="submit" disabled={loading} className="sm:col-span-2">
        {loading ? "Kaydediliyor…" : "Kullanıcı oluştur"}
      </Button>
    </form>
  );
}
