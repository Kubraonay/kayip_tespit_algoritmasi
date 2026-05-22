import type { IspatKaydi } from "@/lib/db/schema";
import { detectNightAnomaly, generateHourlyFromMonthly } from "./hourly-profile";

export type KacakTipi =
  | "anomali_tuketim"
  | "bypass_hat"
  | "manyetik_mudahale"
  | "dengesiz_yuk"
  | "gece_tuketim"
  | "fider_uyumsuzluk";

export function classifyKacak(
  sapmaYuzde: number,
  tarife: string,
  monthlyKwh: number,
  aboneIndex: number
): KacakTipi {
  const hourly = generateHourlyFromMonthly(monthlyKwh, tarife);
  if (detectNightAnomaly(hourly)) return "gece_tuketim";
  if (sapmaYuzde > 80) return "bypass_hat";
  if (sapmaYuzde > 60 && aboneIndex % 3 === 0) return "manyetik_mudahale";
  if (sapmaYuzde > 50 && tarife === "sanayi") return "dengesiz_yuk";
  if (sapmaYuzde > 45) return "fider_uyumsuzluk";
  return "anomali_tuketim";
}

export function buildIspatlar(params: {
  kacakTipi: KacakTipi;
  currentKwh: number;
  avgKwh: number;
  sapmaYuzde: number;
  aboneNo: string;
  fiderKod?: string;
  trafoKod?: string;
}): IspatKaydi[] {
  const { kacakTipi, currentKwh, avgKwh, sapmaYuzde, aboneNo, fiderKod, trafoKod } =
    params;
  const base: IspatKaydi[] = [
    {
      baslik: "Cari dönem tüketimi",
      deger: String(Math.round(currentKwh)),
      birim: "kWh",
      tip: "olcum",
    },
    {
      baslik: "12 ay ortalaması",
      deger: String(Math.round(avgKwh)),
      birim: "kWh",
      tip: "karsilastirma",
    },
    {
      baslik: "Sapma oranı",
      deger: `%${sapmaYuzde.toFixed(1)}`,
      tip: "hesap",
    },
    {
      baslik: "Abone no",
      deger: aboneNo,
      tip: "olcum",
    },
  ];

  if (trafoKod) {
    base.push({
      baslik: "Beslendiği trafo",
      deger: trafoKod,
      tip: "olcum",
    });
  }
  if (fiderKod) {
    base.push({
      baslik: "Beslendiği fider",
      deger: fiderKod,
      tip: "olcum",
    });
  }

  const hourly = generateHourlyFromMonthly(currentKwh);
  const geceToplam = hourly
    .filter((h) => h.saat <= 5)
    .reduce((a, h) => a + h.kwh, 0);

  switch (kacakTipi) {
    case "gece_tuketim":
      base.push({
        baslik: "00:00–05:59 gece tüketimi",
        deger: String(Math.round(geceToplam)),
        birim: "kWh",
        tip: "profil",
      });
      base.push({
        baslik: "Gece/gündüz oranı",
        deger: "Anormal yüksek",
        tip: "profil",
      });
      break;
    case "bypass_hat":
      base.push({
        baslik: "Sayaç–fider uyumsuzluğu",
        deger: "Giriş > abone toplamı farkı yüksek",
        tip: "hesap",
      });
      break;
    case "manyetik_mudahale":
      base.push({
        baslik: "Reaktif/aktif oran sapması",
        deger: "Beklenen bandın dışında",
        tip: "olcum",
      });
      break;
    case "dengesiz_yuk":
      base.push({
        baslik: "Faz akım dengesizliği",
        deger: ">%25 sapma (simüle)",
        tip: "olcum",
      });
      break;
    case "fider_uyumsuzluk":
      base.push({
        baslik: "Fider enerji bilançosu",
        deger: "Abone toplamı < giriş farkı",
        tip: "hesap",
      });
      break;
    default:
      base.push({
        baslik: "İstatistiksel eşik",
        deger: "Üst persentil aşıldı",
        tip: "hesap",
      });
  }
  return base;
}

export function buildAnlatim(
  kacakTipi: KacakTipi,
  sapmaYuzde: number
): { anlatim: string; muhendisYorumu: string } {
  const texts: Record<
    KacakTipi,
    { anlatim: string; muhendisYorumu: string }
  > = {
    anomali_tuketim: {
      anlatim:
        "Abonenin cari ay tüketimi, geçmiş dönem ortalamasından anlamlı şekilde yüksektir. Teknik kayıplarla açıklanamayan artış, teknik olmayan kayıp (kaçak) şüphesi oluşturur.",
      muhendisYorumu:
        "Saha doğrulama için sayaç mühür kontrolü ve yerinde tüketim denetimi önerilir.",
    },
    bypass_hat: {
      anlatim:
        "Fider giriş–çıkış enerji dengesinde abone toplamlarının ölçülen girişten düşük kalması, sayaç öncesi veya sonrası hattın bypass edilmesi ihtimalini güçlendirir.",
      muhendisYorumu:
        "Harici hat ve sayaç bağlantı noktası görsel inceleme ile desteklenmelidir (EPDK tüketici hizmetleri usulü).",
    },
    manyetik_mudahale: {
      anlatim:
        "Aktif–reaktif enerji ilişkisindeki sapma, sayaç diskine manyetik müdahale veya ölçüm sistemine müdahale göstergeleri ile uyumludur.",
      muhendisYorumu:
        "Sayaç mühür ve müdahale bandı kontrolü; gerekirse kalibrasyon testi talep edilmelidir.",
    },
    dengesiz_yuk: {
      anlatim:
        "Üç fazlı tüketimde fazlar arası akım dengesizliği, hat kayıplarını artırır ve ölçüm tutarsızlığı yaratabilir.",
      muhendisYorumu:
        "Faz akım ölçümü ile yük dağılımı kontrol edilmeli; kompanzasyon ve bağlantı hataları elenmelidir.",
    },
    gece_tuketim: {
      anlatim:
        "Saatlik yük profilinde gece dilimlerinde (00:00–06:00) beklenen mesken/sanayi eğrisine göre yüksek tüketim saptanmıştır.",
      muhendisYorumu:
        "Gece tüketim deseni, sürekli çalışan cihaz veya kaçak hat kullanımı ile uyumlu olabilir; OSOS/saatlik veri ile teyit önerilir.",
    },
    fider_uyumsuzluk: {
      anlatim:
        "Abonenin bağlı olduğu fiderde enerji bilançosu kapanmamaktadır; teknik olmayan kayıp payı bu abone grubunda yoğunlaşmıştır.",
      muhendisYorumu:
        "Fider bazlı toplu saha denetimi planlanmalı; öncelik sırası kritik eşik üzerindeki aboneler için verilmiştir.",
    },
  };
  const t = texts[kacakTipi];
  return {
    anlatim: `${t.anlatim} (Sapma: %${sapmaYuzde.toFixed(1)})`,
    muhendisYorumu: t.muhendisYorumu,
  };
}

export function estimateKayipKwh(
  currentKwh: number,
  avgKwh: number,
  sapmaYuzde: number
): number {
  const diff = Math.max(0, currentKwh - avgKwh);
  return Math.round(diff * (sapmaYuzde / 100) * 10) / 10;
}
