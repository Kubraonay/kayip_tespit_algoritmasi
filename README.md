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
- **Saha Operasyonları** — ekip/personel, görev atama, canlı harita, fotoğraf/not/tutanak, token ile saha sayfası
- **Alarm & Bildirim Merkezi** — kritik/orta/düşük alarmlar, canlı toast, e-posta/SMS/push log, geçmiş

## Kurulum

```bash
npm install
cp .env.example .env.local
# AUTH_SECRET değerini güncelleyin
npm run db:seed
npm run db:migrate-v4
npm run db:migrate-v5
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
| `npm run db:migrate-v4` | Saha operasyonları tabloları + örnek veri |
| `npm run db:migrate-v5` | Alarm & bildirim tabloları |

## Alarm & Bildirim

- `/dashboard/alarm-merkezi` — seviye filtreli aktif alarmlar
- `/dashboard/bildirimler/canli` — canlı akış + toast
- `/dashboard/bildirimler/gecmis` — tam geçmiş
- `/dashboard/bildirimler/ayarlar` — e-posta / SMS / push tercihleri
- Header zil ikonu: 12 sn polling, tarayıcı push (izin ile)

## Saha Operasyonları

- Panel: `/dashboard/saha-operasyonlari` (ekipler, personel, görevler, harita)
- Kaçak tespit detayından **Saha görevi oluştur**
- Saha personeli (giriş yok): paylaşım linki `/saha/gorev/[token]` — GPS, fotoğraf, not, tutanak
- Haritada **Simülasyonu güncelle** (geliştirme/demo konumları)

## Veritabanı

SQLite dosyası: `data/app.db`

### `NODE_MODULE_VERSION` hatası (better-sqlite3)

İki farklı Node kurulumu (ör. Cursor Node 22 + sistem Node 26) varsa native modül uyumsuz olabilir. Çözüm:

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm rebuild better-sqlite3
```

Ardından `npm run dev` sürecini yeniden başlatın. Projede `.vscode/settings.json` terminalde önce sistem Node’unu kullanır.

## Dokümantasyon

- [docs/kayip-kacak-turkiye.md](docs/kayip-kacak-turkiye.md) — Türkiye metodolojisi
- Uygulama içi: `/dashboard/bilgilendirme`

## Teknoloji

- Next.js 16, React 19, TypeScript
- SQLite + Drizzle ORM
- NextAuth (Credentials)
- Tailwind CSS, Recharts
