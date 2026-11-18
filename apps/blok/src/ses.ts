/* Sesli yönerge: tarayıcının kendi Türkçe sesi (internetsiz, ücretsiz). Türkçe ses yoksa sessizce devre dışı. */
const ANAHTAR = "sra-blok-ses";
let turkce: SpeechSynthesisVoice | null = null;
const destek = typeof window !== "undefined" && "speechSynthesis" in window;

function sesBul() {
  if (!destek) return;
  turkce = speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("tr")) ?? null;
}
if (destek) { sesBul(); speechSynthesis.addEventListener?.("voiceschanged", () => { sesBul(); dinleyiciler.forEach((f) => f()); }); }
const dinleyiciler = new Set<() => void>();

export const ses = {
  /** Türkçe ses var mı? (yoksa ses düğmesi gizlenir) */
  get var(): boolean { return !!turkce; },
  get acik(): boolean { try { return localStorage.getItem(ANAHTAR) !== "kapali"; } catch { return true; } },
  set acik(v: boolean) { try { localStorage.setItem(ANAHTAR, v ? "acik" : "kapali"); } catch { /* yok */ } if (!v && destek) speechSynthesis.cancel(); },
  oku(metin: string, zorla = false) {
    if (!turkce || (!this.acik && !zorla)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(metin);
    u.voice = turkce; u.lang = turkce.lang; u.rate = 0.92; u.pitch = 1.05;
    speechSynthesis.speak(u);
  },
  degisince(f: () => void) { dinleyiciler.add(f); return () => dinleyiciler.delete(f); }
};
