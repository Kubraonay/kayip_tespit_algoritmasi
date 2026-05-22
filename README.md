# Akdeniz Dağıtım — Kayıp Kaçak Tespit

Elektrik mühendisleri için abone, sayaç ve şebeke hiyerarşisi üzerinden kayıp-kaçak analizi yapan Next.js uygulaması.

## Özellikler

- Login / Register (Auth.js)
- Abone listesi ve detay sayfası
- Sayaç yönetimi ve aylık tüketim girişi
- Trafo → Fider → Abone şebeke ağacı
- EPDK uyumlu TKK, HKK ve enerji denge analizi
- Dashboard (KPI, grafikler, alarmlar)
- CSV içe aktarma
- Bilgilendirme sayfası (formüller ve mevzuat özeti)

## Kurulum

```bash
npm install
cp .env.example .env.local
# AUTH_SECRET değerini güncelleyin
npm run db:seed
npm run dev
```

Tarayıcı: http://localhost:3000

### Varsayılan admin (seed sonrası)

- E-posta: `admin@akdeniz.local`
- Şifre: `admin123`

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run db:seed` | Örnek veri + tablolar |
| `npm run db:push` | Drizzle şema push |

## Veritabanı

SQLite dosyası: `data/app.db`

## Dokümantasyon

- [docs/kayip-kacak-turkiye.md](docs/kayip-kacak-turkiye.md) — Türkiye metodolojisi
- Uygulama içi: `/dashboard/bilgilendirme`

## Teknoloji

- Next.js 16, React 19, TypeScript
- SQLite + Drizzle ORM
- NextAuth (Credentials)
- Tailwind CSS, Recharts
