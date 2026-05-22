import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";

export const USER_ROLES = [
  "admin",
  "yonetici",
  "operator",
  "saha_personeli",
  "izleyici",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  adSoyad: text("ad_soyad").notNull(),
  rol: text("rol", { enum: USER_ROLES }).notNull().default("operator"),
  aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
  sonGirisAt: integer("son_giris_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const rolYetkileri = sqliteTable(
  "rol_yetkileri",
  {
    rol: text("rol").notNull(),
    yetki: text("yetki").notNull(),
    aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [unique().on(t.rol, t.yetki)]
);

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

export const SAHA_GOREV_DURUMLARI = [
  "beklemede",
  "atandi",
  "yola_cikildi",
  "sahada",
  "inceleme",
  "tamamlandi",
  "iptal",
] as const;

export type SahaGorevDurum = (typeof SAHA_GOREV_DURUMLARI)[number];

export const sahaEkipleri = sqliteTable("saha_ekipleri", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kod: text("kod").notNull().unique(),
  ad: text("ad").notNull(),
  bolge: text("bolge"),
  trafoId: integer("trafo_id").references(() => trafoMerkezleri.id, {
    onDelete: "set null",
  }),
  aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sahaPersonelleri = sqliteTable("saha_personelleri", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sicilNo: text("sicil_no").notNull().unique(),
  adSoyad: text("ad_soyad").notNull(),
  telefon: text("telefon"),
  ekipId: integer("ekip_id").references(() => sahaEkipleri.id, {
    onDelete: "set null",
  }),
  unvan: text("unvan").default("saha_teknisyeni"),
  aktif: integer("aktif", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sahaGorevleri = sqliteTable("saha_gorevleri", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kacakTespitId: integer("kacak_tespit_id").references(() => kacakTespitleri.id, {
    onDelete: "set null",
  }),
  aboneId: integer("abone_id")
    .notNull()
    .references(() => aboneler.id, { onDelete: "cascade" }),
  ekipId: integer("ekip_id")
    .notNull()
    .references(() => sahaEkipleri.id),
  atananPersonelId: integer("atanan_personel_id").references(
    () => sahaPersonelleri.id,
    { onDelete: "set null" }
  ),
  durum: text("durum").notNull().default("beklemede"),
  oncelik: text("oncelik", { enum: ["dusuk", "normal", "yuksek"] })
    .notNull()
    .default("normal"),
  planlananTarih: integer("planlanan_tarih", { mode: "timestamp" }),
  hedefEnlem: real("hedef_enlem"),
  hedefBoylam: real("hedef_boylam"),
  paylasimToken: text("paylasim_token").notNull().unique(),
  createdBy: integer("created_by").references(() => users.id),
  baslangicAt: integer("baslangic_at", { mode: "timestamp" }),
  bitisAt: integer("bitis_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sahaGorevDurumGecmisi = sqliteTable("saha_gorev_durum_gecmisi", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gorevId: integer("gorev_id")
    .notNull()
    .references(() => sahaGorevleri.id, { onDelete: "cascade" }),
  durum: text("durum").notNull(),
  notMetni: text("not_metni"),
  kullaniciId: integer("kullanici_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sahaGorevNotlari = sqliteTable("saha_gorev_notlari", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gorevId: integer("gorev_id")
    .notNull()
    .references(() => sahaGorevleri.id, { onDelete: "cascade" }),
  kullaniciId: integer("kullanici_id").references(() => users.id),
  kaynak: text("kaynak", { enum: ["merkez", "saha"] })
    .notNull()
    .default("merkez"),
  icerik: text("icerik").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sahaGorevFotograflari = sqliteTable("saha_gorev_fotograflari", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gorevId: integer("gorev_id")
    .notNull()
    .references(() => sahaGorevleri.id, { onDelete: "cascade" }),
  dosyaYolu: text("dosya_yolu").notNull(),
  aciklama: text("aciklama"),
  kaynak: text("kaynak", { enum: ["merkez", "saha"] })
    .notNull()
    .default("saha"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sahaTutanaklari = sqliteTable("saha_tutanaklari", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gorevId: integer("gorev_id")
    .notNull()
    .references(() => sahaGorevleri.id, { onDelete: "cascade" })
    .unique(),
  icerik: text("icerik").notNull(),
  imzalayan: text("imzalayan"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sahaKonumlari = sqliteTable("saha_konumlari", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personelId: integer("personel_id")
    .notNull()
    .references(() => sahaPersonelleri.id, { onDelete: "cascade" }),
  gorevId: integer("gorev_id").references(() => sahaGorevleri.id, {
    onDelete: "set null",
  }),
  enlem: real("enlem").notNull(),
  boylam: real("boylam").notNull(),
  kaynak: text("kaynak", { enum: ["gps", "simulasyon"] })
    .notNull()
    .default("gps"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const ALARM_TIPLERI = [
  "ani_tuketim_artisi",
  "sayac_enerjisiz",
  "muhur_acildi",
  "ters_baglanti",
  "faz_kaybi",
  "sayac_offline",
] as const;

export type AlarmTipi = (typeof ALARM_TIPLERI)[number];

export const ALARM_SEVIYELERI = ["kritik", "orta", "dusuk"] as const;
export type AlarmSeviye = (typeof ALARM_SEVIYELERI)[number];

export const alarmlar = sqliteTable("alarmlar", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tip: text("tip").notNull(),
  seviye: text("seviye").notNull(),
  baslik: text("baslik").notNull(),
  aciklama: text("aciklama").notNull(),
  detay: text("detay"),
  aboneId: integer("abone_id").references(() => aboneler.id, {
    onDelete: "set null",
  }),
  sayacId: integer("sayac_id").references(() => sayaclar.id, {
    onDelete: "set null",
  }),
  aboneNo: text("abone_no"),
  sayacSeri: text("sayac_seri"),
  durum: text("durum", { enum: ["aktif", "cozuldu", "okundu"] })
    .notNull()
    .default("aktif"),
  okundu: integer("okundu", { mode: "boolean" }).notNull().default(false),
  cozulmeAt: integer("cozulme_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const alarmBildirimLoglari = sqliteTable("alarm_bildirim_loglari", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  alarmId: integer("alarm_id")
    .notNull()
    .references(() => alarmlar.id, { onDelete: "cascade" }),
  kullaniciId: integer("kullanici_id").references(() => users.id),
  kanal: text("kanal", { enum: ["in_app", "email", "sms", "push"] }).notNull(),
  alici: text("alici"),
  durum: text("durum", { enum: ["gonderildi", "beklemede", "hata"] })
    .notNull()
    .default("beklemede"),
  mesaj: text("mesaj"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const kullaniciBildirimAyarlari = sqliteTable("kullanici_bildirim_ayarlari", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kullaniciId: integer("kullanici_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  emailAktif: integer("email_aktif", { mode: "boolean" }).notNull().default(true),
  smsAktif: integer("sms_aktif", { mode: "boolean" }).notNull().default(false),
  pushAktif: integer("push_aktif", { mode: "boolean" }).notNull().default(true),
  telefon: text("telefon"),
  pushEndpoint: text("push_endpoint"),
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
export type RolYetki = typeof rolYetkileri.$inferSelect;
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
  kullanici_guncellendi: "Kullanıcı güncellendi",
  kullanici_rol_guncellendi: "Kullanıcı rolü güncellendi",
  kullanici_devre_disı: "Kullanıcı devre dışı bırakıldı",
  kullanici_sifre_sifirlandi: "Kullanıcı şifresi sıfırlandı",
  kullanici_silindi: "Kullanıcı silindi",
  rol_yetki_guncellendi: "Rol yetkileri güncellendi",
  rol_yetki_varsayilan: "Rol yetkileri varsayılana sıfırlandı",
  erisim_reddedildi: "Erişim reddedildi",
  giris_basarisiz: "Başarısız giriş denemesi",
  cikis_yapildi: "Sistemden çıkış",
  abone_olusturuldu: "Abone kaydı oluşturuldu",
  tuketim_guncellendi: "Tüketim verisi güncellendi",
  trafo_olusturuldu: "Trafo merkezi eklendi",
  fider_olusturuldu: "Fider eklendi",
  veri_aktarildi: "CSV veri aktarımı",
  giris_yapildi: "Sisteme giriş",
  saha_gorev_olusturuldu: "Saha görevi oluşturuldu",
  saha_durum_guncellendi: "Saha görev durumu güncellendi",
  saha_foto_yuklendi: "Saha görev fotoğrafı yüklendi",
  saha_tutanak_olusturuldu: "Dijital tutanak kaydedildi",
  saha_konum_guncellendi: "Saha konum güncellendi",
  saha_ekip_olusturuldu: "Saha ekibi oluşturuldu",
  saha_personel_olusturuldu: "Saha personeli oluşturuldu",
  alarm_olusturuldu: "Sistem alarmı oluşturuldu",
  alarm_cozuldu: "Alarm çözüldü",
};

export const ALARM_TIPI_LABELS: Record<AlarmTipi, string> = {
  ani_tuketim_artisi: "Ani Tüketim Artışı",
  sayac_enerjisiz: "Sayaç Enerjisiz",
  muhur_acildi: "Mühür Açılması",
  ters_baglanti: "Ters Bağlantı",
  faz_kaybi: "Faz Kaybı",
  sayac_offline: "Sayaç Offline",
};

export const ALARM_SEVIYE_LABELS: Record<AlarmSeviye, string> = {
  kritik: "Kritik",
  orta: "Orta",
  dusuk: "Düşük",
};

export type Alarm = typeof alarmlar.$inferSelect;

export const SAHA_GOREV_DURUM_LABELS: Record<string, string> = {
  beklemede: "Beklemede",
  atandi: "Atandı",
  yola_cikildi: "Yola Çıktı",
  sahada: "Sahada",
  inceleme: "İnceleme",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const SAHA_ONCELIK_LABELS: Record<string, string> = {
  dusuk: "Düşük",
  normal: "Normal",
  yuksek: "Yüksek",
};

export type SahaEkip = typeof sahaEkipleri.$inferSelect;
export type SahaPersonel = typeof sahaPersonelleri.$inferSelect;
export type SahaGorev = typeof sahaGorevleri.$inferSelect;
export type SahaTutanak = typeof sahaTutanaklari.$inferSelect;

export type TutanakIcerik = {
  tarih: string;
  ekipAd: string;
  aboneNo: string;
  aboneAdSoyad: string;
  adres?: string;
  tespitOzeti: string;
  sahaBulgusu: string;
  olcumNotu?: string;
  imzaMetni?: string;
};
export type SaatlikTuketim = typeof saatlikTuketim.$inferSelect;

export type IspatKaydi = {
  baslik: string;
  deger: string;
  birim?: string;
  tip: "olcum" | "hesap" | "profil" | "karsilastirma";
};

export const ISPAT_TIPI_LABELS: Record<IspatKaydi["tip"], string> = {
  olcum: "Ölçüm",
  hesap: "Hesap",
  profil: "Profil",
  karsilastirma: "Karşılaştırma",
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
