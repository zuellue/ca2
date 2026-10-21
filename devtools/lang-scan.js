// language guard (owner 21 Oct): every user-facing string and every repo comment is English only.
// Scans the shipped files for Turkish-specific characters and known Turkish UI words; exits 1 with file:line on any hit.
// Run: node devtools/lang-scan.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const FILES = ['index.html', 'ca2.js', 'device.html', 'audio.js', 'grain.js', 'favicon.js'];
const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
const TR_WORDS = ['kilitli', 'kilit', 'kaydet', 'kayıt', 'tamam', 'iptal', 'şifre', 'parola', 'çıkış', 'dokun', 'dokunma', 'sürükle', 'sıfırla', 'rastgele', 'bekleyin', 'yükleniyor', 'kapat', 'kapalı', 'açık', 'giriş', 'icin', 'tavan', 'kullanici', 'ayni', 'yukseklik', 'gecerli', 'genisletme', 'boyutu', 'degil', 'gibi', 'yok', 'cok', 'diye', 'simdi', 'nasil', 'hangi', 'hepsi', 'sadece', 'böyle', 'şöyle', 'olarak', 'bölünme', 'ayarlar', 'ayarları', 'göster', 'gizle', 'buton', 'sayfa', 'ekran', 'ayar', 'seç', 'sil', 'yeni', 'eski', 'üst', 'alt', 'sağ', 'sol', 'orta', 'geri', 'ileri', 'devre', 'etkin', 'pasif', 'çizgi', 'nokta', 'kenar', 'köşe', 'merkez', 'ölçek', 'oran', 'boyut', 'renk', 'ses', 'dil'];
const TR_RE = new RegExp('(^|[^a-zA-Z])(' + TR_WORDS.join('|') + ')([^a-zA-Z]|$)', 'i');
let hits = 0;
for (const f of FILES) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    if (TR_CHARS.test(line)) { hits++; console.log(f + ':' + (i + 1) + ': Turkish character: ' + line.trim().slice(0, 120)); }
    const m = line.match(TR_RE);
    if (m) { hits++; console.log(f + ':' + (i + 1) + ': Turkish word "' + m[2] + '": ' + line.trim().slice(0, 120)); }
  });
}
console.log(hits ? 'lang-scan: ' + hits + ' hit(s) - UI text and comments are English only (owner 21 Oct)' : 'lang-scan: clean');
process.exit(hits ? 1 : 0);
