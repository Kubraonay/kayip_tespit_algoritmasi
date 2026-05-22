import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  adSoyad: text("ad_soyad").notNull(),
  rol: text("rol", { enum: ["muhendis", "admin", "izleyici"] })
    .notNull()
    .default("muhendis"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const trafoMerkezleri = sqliteTable("trafo_merkezleri", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kod: text("kod").notNull().unique(),
  ad: text("ad").notNull(),
  ilce: text("ilce"),
  kapasiteKva: real("kapasite_kva").notNull().default(400),
  gerilimKv: real("gerilim_kv").notNull().default(15.8),
  pbKw: real("pb_kw"),
  pcuKw: real("pcu_kw"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const fiderler = sqliteTable("fiderler", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trafoId: integer("trafo_id")
    .notNull()
    .references(() => trafoMerkezleri.id, { onDelete: "cascade" }),
  kod: text("kod").notNull(),
  ad: text("ad").notNull(),
  hatUzunlukM: real("hat_uzunluk_m").default(500),
  kesitMm2: real("kesit_mm2").default(95),
  gerilimKv: real("gerilim_kv").default(0.4),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const aboneler = sqliteTable("aboneler", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  aboneNo: text("abone_no").notNull().unique(),
  ad: text("ad").notNull(),
  soyad: text("soyad").notNull(),
  adres: text("adres"),
  trafoId: integer("trafo_id").references(() => trafoMerkezleri.id),
  fiderId: integer("fider_id").references(() => fiderler.id),
  tarifeGrubu: text("tarife_grubu").default("mesken"),
  durum: text("durum", { enum: ["aktif", "pasif"] })
    .notNull()
    .default("aktif"),
  enlem: real("enlem"),
  boylam: real("boylam"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sayaclar = sqliteTable("sayaclar", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  seriNo: text("seri_no").notNull().unique(),
  tip: text("tip", {
    enum: ["abone", "bolgesel", "trafo_giris", "trafo_cikis", "fider_giris"],
  }).notNull(),
  aboneId: integer("abone_id").references(() => aboneler.id, {
    onDelete: "set null",
  }),
  trafoId: integer("trafo_id").references(() => trafoMerkezleri.id, {
    onDelete: "set null",
  }),
  fiderId: integer("fider_id").references(() => fiderler.id, {
    onDelete: "set null",
  }),
  marka: text("marka"),
  faz: integer("faz").default(3),
  hane: integer("hane").default(6),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const aylikTuketim = sqliteTable(
  "aylik_tuketim",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sayacId: integer("sayac_id")
      .notNull()
      .references(() => sayaclar.id, { onDelete: "cascade" }),
    yil: integer("yil").notNull(),
    ay: integer("ay").notNull(),
    aktifKwh: real("aktif_kwh").notNull(),
    reaktifKvarh: real("reaktif_kvarh"),
    endeks: real("endeks"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [unique().on(t.sayacId, t.yil, t.ay)]
);

export const saatlikTuketim = sqliteTable(
  "saatlik_tuketim",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sayacId: integer("sayac_id")
      .notNull()
      .references(() => sayaclar.id, { onDelete: "cascade" }),
    yil: integer("yil").notNull(),
    ay: integer("ay").notNull(),
    gun: integer("gun").notNull().default(15),
    saat: integer("saat").notNull(),
    aktifKwh: real("aktif_kwh").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [unique().on(t.sayacId, t.yil, t.ay, t.gun, t.saat)]
);

export const kayipAnalizleri = sqliteTable("kayip_analizleri", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  seviye: text("seviye", { enum: ["abone", "fider", "trafo", "sistem"] }).notNull(),
  referansId: integer("referans_id"),
  donem: text("donem").notNull(),
  eGiris: real("e_giris"),
  eCikis: real("e_cikis"),
  eAboneToplam: real("e_abone_toplam"),
  eTeknik: real("e_teknik"),
  eTeknikOlmayan: real("e_teknik_olmayan"),
  oranYuzde: real("oran_yuzde"),
  durum: text("durum", { enum: ["normal", "uyari", "kritik"] })
    .notNull()
    .default("normal"),
  aciklama: text("aciklama"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const kacakTespitleri = sqliteTable("kacak_tespitleri", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  aboneId: integer("abone_id")
    .notNull()
    .references(() => aboneler.id, { onDelete: "cascade" }),
  analizId: integer("analiz_id").references(() => kayipAnalizleri.id, {
    onDelete: "set null",
  }),
  donem: text("donem").notNull(),
  kacakTipi: text("kacak_tipi", {
    enum: [
      "anomali_tuketim",
      "bypass_hat",
      "manyetik_mudahale",
      "dengesiz_yuk",
      "gece_tuketim",
      "fider_uyumsuzluk",
    ],
  }).notNull(),
  durum: text("durum", { enum: ["uyari", "kritik"] }).notNull(),
  guvenSkoru: real("guven_skoru").notNull().default(70),
  tahminiKayipKwh: real("tahmini_kayip_kwh"),
  ispatlar: text("ispatlar").notNull(),
  anlatim: text("anlatim").notNull(),
  muhendisYorumu: text("muhendis_yorumu"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const kacakNotlari = sqliteTable("kacak_notlari", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kacakTespitId: integer("kacak_tespit_id")
    .notNull()
    .references(() => kacakTespitleri.id, { onDelete: "cascade" }),
  kullaniciId: integer("kullanici_id")
    .notNull()
    .references(() => users.id),
  icerik: text("icerik").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const islemLoglari = sqliteTable("islem_loglari", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kullaniciId: integer("kullanici_id").references(() => users.id),
  kullaniciAd: text("kullanici_ad"),
  islemTipi: text("islem_tipi").notNull(),
  varlikTipi: text("varlik_tipi"),
  varlikId: integer("varlik_id"),
  aciklama: text("aciklama").notNull(),
  detay: text("detay"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const importLog = sqliteTable("import_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dosya: text("dosya").notNull(),
  tip: text("tip").notNull(),
  satirSayisi: integer("satir_sayisi").default(0),
  basarili: integer("basarili").default(0),
  hatalar: text("hatalar"),
  kullaniciId: integer("kullanici_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type TrafoMerkezi = typeof trafoMerkezleri.$inferSelect;
export type Fider = typeof fiderler.$inferSelect;
export type Abone = typeof aboneler.$inferSelect;
export type Sayac = typeof sayaclar.$inferSelect;
export type AylikTuketim = typeof aylikTuketim.$inferSelect;
export type KayipAnalizi = typeof kayipAnalizleri.$inferSelect;
export type KacakTespiti = typeof kacakTespitleri.$inferSelect;
export type KacakNotu = typeof kacakNotlari.$inferSelect;
export type IslemLogu = typeof islemLoglari.$inferSelect;

export const ISLEM_TIPI_LABELS: Record<string, string> = {
  kacak_not_eklendi: "Kaçak tespit notu eklendi",
  analiz_calistirildi: "Kayıp kaçak analizi çalıştırıldı",
  kullanici_olusturuldu: "Kullanıcı oluşturuldu",
  kullanici_rol_guncellendi: "Kullanıcı rolü güncellendi",
  kullanici_silindi: "Kullanıcı silindi",
  abone_olusturuldu: "Abone kaydı oluşturuldu",
  tuketim_guncellendi: "Tüketim verisi güncellendi",
  trafo_olusturuldu: "Trafo merkezi eklendi",
  fider_olusturuldu: "Fider eklendi",
  veri_aktarildi: "CSV veri aktarımı",
  giris_yapildi: "Sisteme giriş",
};
export type SaatlikTuketim = typeof saatlikTuketim.$inferSelect;

export type IspatKaydi = {
  baslik: string;
  deger: string;
  birim?: string;
  tip: "olcum" | "hesap" | "profil" | "karsilastirma";
};

export const KACAK_TIPI_LABELS: Record<
  KacakTespiti["kacakTipi"],
  string
> = {
  anomali_tuketim: "Anormal Tüketim Artışı",
  bypass_hat: "Sayaç Bypass / Hariç Hat",
  manyetik_mudahale: "Manyetik Müdahale Şüphesi",
  dengesiz_yuk: "Faz Dengesizliği",
  gece_tuketim: "Gece Tüketim Anomalisi",
  fider_uyumsuzluk: "Fider Enerji Uyumsuzluğu",
};
