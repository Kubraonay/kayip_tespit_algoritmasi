# Türkiye Elektrik Dağıtımında Kayıp-Kaçak Tespiti

Bu doküman, Akdeniz Dağıtım Kayıp Kaçak Tespit uygulamasının dayandığı Türkiye metodolojisini özetler.

## 1. Yasal Çerçeve

**6446 sayılı Elektrik Piyasası Kanunu** ve **EPDK** düzenlemeleri kapsamında:

- **Teknik ve teknik olmayan kayıp:** Dağıtım sistemine giren enerji ile fatura tahakkukuna esas çıkan enerji arasındaki fark.
- **Teknik kayıp:** Dağıtım tesisi unsurlarında (trafo, hat) oluşan kayıplar.
- **Teknik olmayan kayıp:** Kaçak kullanım, ölçüm hataları, faturalandırılmayan tüketim vb.

EPDK, dağıtım şirketleri için **hedef kayıp oranları** belirler. Hedefin üzerindeki performans gelir kaybına yol açar.

## 2. Sistem Düzeyi Oran

```
η_KK = (E_giriş - E_faturalanan) / E_giriş × 100%
E_teknik_olmayan = E_giriş - E_faturalanan - E_teknik
```

## 3. Enerji Denge Yöntemi

Dağıtım şebekesinde (EDAŞ / SCADA uygulamaları):

```
ΔE = E_giriş - ΣE_trafo_çıkış - ΣE_bölgesel - ΣE_abone
η_fider = (ΔE / E_giriş) × 100%
```

Teknik kayıpla açıklanamayan fark, saha inceleme ve kaçak şüphesi için işaretlenir.

## 4. EPDK Kayıp Katsayıları Metodolojisi

**Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği** ekinde yayımlanan metodoloji.

### Transformatör Kayıp Katsayısı (TKK)

Çekiş yönü (tek yönlü sayaç):

```
TKK_ç = [P_b + P_cu × (E / (P_n × T × cosφ))²] / E
E_teknik_trafo = TKK × E
```

- P_b: Boşta kayıp (kW)
- P_cu: Yükte kayıp (kW)
- P_n: Nominal güç (kVA)
- T: Aylık saat (h)
- cosφ = 0,95

### Hat Kayıp Katsayısı (HKK)

```
HKK = (ρ × L × E) / (S × U_n² × D × T × cosφ)
```

## 5. Mühendislik Trafo Kaybı

```
ΔP = P_0 + K_T × β² × P_k
E_trafo_kayıp = ΔP × T  (kWh)
β = I / I_n
```

## 6. Kaynaklar

- [EPDK](https://www.epdk.gov.tr)
- [Kayıp Katsayıları Hesaplama Metodolojisi](https://etisan.net/blog/2011/02/02/kayip-katsayilari-hesaplama-metodolojisi/)
- Elektrik Piyasası Dengeleme ve Uzlaştırma Yönetmeliği
- Yüksek Kayıplı Şirketlere İlişkin Usul ve Esaslar (Resmi Gazete)

## 7. Saha operasyonları

Kaçak tespit sonrası saha ekibine görev atanır; merkez panelden durum, konum ve dijital tutanak takip edilir. Saha personeli ayrı kullanıcı hesabı olmadan görev token linki ile sahada GPS, fotoğraf ve not iletebilir.

## 8. Uygulama Sınırı

Bu yazılım mühendis karar destek aracıdır; resmi kaçak tespit tutanağı veya hukuki belge üretmez (dijital tutanak taslak kayıttır). OSOS/SCADA canlı entegrasyonu ayrı fazda planlanmalıdır.
