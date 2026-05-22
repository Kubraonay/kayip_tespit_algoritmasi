"use client";

import { useState } from "react";
import { createUserByAdmin } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddUserForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const res = await createUserByAdmin(new FormData(e.currentTarget));
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Ad Soyad</Label>
          <Input name="adSoyad" required />
        </div>
        <div>
          <Label>E-posta</Label>
          <Input name="email" type="email" required />
        </div>
        <div>
          <Label>Şifre (min. 8)</Label>
          <Input name="password" type="password" minLength={8} required />
        </div>
        <div>
          <Label>Yetki</Label>
          <select
            name="rol"
            className="flex h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            defaultValue="muhendis"
          >
            <option value="muhendis">Elektrik Mühendisi</option>
            <option value="izleyici">İzleyici</option>
            <option value="admin">Yönetici</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-600">Kullanıcı oluşturuldu</p>
      )}
      <Button type="submit">Kullanıcı Ekle</Button>
    </form>
  );
}
