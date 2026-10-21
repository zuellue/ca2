// language rule (owner 21 Oct): every user-visible string in the ca UI is English - no Turkish text,
// no exceptions (buttons, labels, title/aria/hover text, error messages, css content). This check fails
// the build on Turkish characters or known Turkish UI words in any shipped UI file. Run: node devtools/langcheck.js
const fs = require('fs');
const FILES = ['index.html', 'ca2.js', 'device.html', 'audio.js', 'grain.js', 'favicon.js'];
const CHARS = /[çÇğĞıİöÖşŞüÜ]/;
const WORDS = /\b(kilitli|kaydet|kaydedildi|kayıt|tamam|iptal|hata|yükleniyor|yukleniyor|bekleyin|kapat|güncelle|guncelle|başlat|baslat|durdur|devam|şifre|sifre|parola|uyarı|uyari|dikkat|çıkış|cikis|giriş|giris|kullanıcı|kullanici|ayarlar)\b/i;
let bad = 0;
for (const f of FILES) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((ln, i) => {
    if (CHARS.test(ln) || WORDS.test(ln)) { bad++; console.log(f + ':' + (i + 1) + ': ' + ln.trim().slice(0, 120)); }
  });
}
if (bad) { console.log('langcheck: ' + bad + ' Turkish text hit(s) - UI text is English only'); process.exit(1); }
console.log('langcheck: clean (' + FILES.length + ' files, 0 Turkish text hits)');
