import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BilgilendirmePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Kayıp Kaçak Bilgilendirme</h2>
        <p className="text-slate-700">
          Türkiye elektrik dağıtım sektörü metodolojisi ve uygulama formülleri
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Resmi Tanım (6446 / EPDK)</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none space-y-4 text-sm">
          <p>
            <strong>Toplam kayıp-kaçak:</strong> Dağıtım sistemine giren enerji
            ile fatura tahakkukuna esas sistemden çıkan enerji arasındaki farktır.
          </p>
          <p>
            <strong>Teknik kayıp:</strong> Trafo, hat ve şebeke unsurlarındaki
            ısıl ve empedans kayıplarıdır (TKK, HKK ile uzlaştırmada hesaplanır).
          </p>
          <p>
            <strong>Teknik olmayan kayıp (kaçak):</strong> Usulsüz kullanım,
            ölçüm hatası, faturalandırılmayan tüketim vb.
          </p>
          <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm">
            η<sub>KK</sub> = (E<sub>giriş</sub> − E<sub>faturalanan</sub>) /
            E<sub>giriş</sub> × 100%
          </div>
          <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm">
            E<sub>teknik olmayan</sub> = E<sub>giriş</sub> − E<sub>faturalanan</sub> − E<sub>teknik</sub>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Enerji Denge Yöntemi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <p>
            Fider veya trafo merkezinde giriş enerjisi ile alt kademe toplamları
            karşılaştırılır. Teknik kayıpla açıklanamayan fark şüpheli bölge olarak
            işaretlenir.
          </p>
          <div className="rounded-lg bg-sky-50 p-4 font-mono">
            ΔE = E<sub>giriş</sub> − ΣE<sub>trafo çıkış</sub> − ΣE<sub>bölgesel</sub> − ΣE<sub>abone</sub>
          </div>
          <div className="rounded-lg bg-sky-50 p-4 font-mono">
            η<sub>fider</sub> = (ΔE / E<sub>giriş</sub>) × 100%
          </div>
          <p className="text-slate-700">
            Bu uygulamada fider analizi: fider giriş sayacı okuması ile bağlı
            abone sayaçlarının toplamı kıyaslanır; hat teknik kaybı HKK ile
            düzeltilir.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. EPDK Kayıp Katsayıları (TKK / HKK)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            <strong>Transformatör kayıp katsayısı (çekiş yönü):</strong>
          </p>
          <div className="rounded-lg bg-slate-100 p-4 font-mono text-xs sm:text-sm">
            TKK<sub>ç</sub> = [P<sub>b</sub> + P<sub>cu</sub> × (E / (P<sub>n</sub> × T × cosφ))²] / E
          </div>
          <p>
            <strong>Hat kayıp katsayısı:</strong>
          </p>
          <div className="rounded-lg bg-slate-100 p-4 font-mono text-xs sm:text-sm">
            HKK = (ρ × L × E) / (S × U<sub>n</sub>² × D × T × cosφ)
          </div>
          <p className="text-slate-700">
            ρ: özdirenç (Ω·mm²/m), L: hat uzunluğu (m), S: kesit (mm²), E: aylık
            enerji (kWh), U<sub>n</sub>: gerilim (kV), D: devre sayısı, T: saat,
            cosφ = 0,95
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Trafo Mühendislik Kaybı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg bg-orange-50 p-4 font-mono">
            ΔP = P₀ + K<sub>T</sub> × β² × P<sub>k</sub>
          </div>
          <div className="rounded-lg bg-orange-50 p-4 font-mono">
            E<sub>trafo kayıp</sub> = ΔP × T (kWh)
          </div>
          <p>
            β = yük akımı / nominal akım. P₀ ve P<sub>k</sub> değerleri EPDK
            tablolarından (50–1600 kVA) veya trafo fabrika test değerlerinden alınır.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Uygulama Eşlemesi</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-700">
                <th className="pb-2 pr-4">Ekran</th>
                <th className="pb-2">Hesap</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-b">
                <td className="py-2 pr-4">Dashboard kayıp oranı</td>
                <td className="py-2">(Trafo giriş − Abone toplam) / Trafo giriş</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Fider analizi</td>
                <td className="py-2">Enerji denge + HKK hat kaybı</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Trafo analizi</td>
                <td className="py-2">TKK tabanlı teknik kayıp + fider toplamları</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Abone alarmı</td>
                <td className="py-2">Geçmiş ortalamadan % sapma (anomali eşiği)</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kaynaklar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="list-inside list-disc space-y-2 text-sky-700">
            <li>
              <a
                href="https://www.epdk.gov.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                EPDK — Enerji Piyasası Düzenleme Kurumu
              </a>
            </li>
            <li>
              <a
                href="https://etisan.net/blog/2011/02/02/kayip-katsayilari-hesaplama-metodolojisi/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Kayıp Katsayıları Hesaplama Metodolojisi
              </a>
            </li>
            <li>6446 sayılı Elektrik Piyasası Kanunu</li>
            <li>Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
