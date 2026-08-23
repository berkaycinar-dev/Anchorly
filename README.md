# Loop

Günlük görevleri ve alışkanlıkları tek bir yerden takip etmek için geliştirdiğim, React tabanlı bir görev/alışkanlık yönetim panosu.

**Canlı demo:** _Yakında eklenecek_

## Özellikler

- **Dashboard** — toplam/tamamlanan/devam eden görev sayıları ve günlük tamamlanma oranını gösteren dairesel grafik
- **Today (Bugünün Görevleri)** — görev ekleme, silme, tamamlandı olarak işaretleme
  - Başlığa göre arama
  - Tümü / Aktif / Tamamlanan filtreleme
  - Her görev için kategori (İş, Kişisel, Kişisel Gelişim, Diğer) ve tarih
- **Daily Routine (Günlük Rutin)** — aylık takvim görünümünde alışkanlık takibi, ay ay ileri/geri gezinme, yeni rutin ekleme/silme
- **Dark Mode** — açık/koyu tema geçişi
- **Kalıcı veri** — tüm görev ve rutin verileri tarayıcının `localStorage`'ında saklanır, sayfa yenilendiğinde kaybolmaz

## Kullanılan Teknolojiler

- React 19
- Vite
- Vanilla CSS (herhangi bir UI kütüphanesi kullanılmadı)

## Kurulum

```bash
git clone https://github.com/kullaniciadin/loop.git
cd loop
npm install
npm run dev
```

## Klasör Yapısı
