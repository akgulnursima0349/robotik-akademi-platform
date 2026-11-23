/* Çizgi ikonlar (lucide). Yalnızca kullanılanlar paketlenir. */
import okSag from "lucide-static/icons/arrow-right.svg?raw";
import girisIkon from "lucide-static/icons/log-in.svg?raw";
import cikisIkon from "lucide-static/icons/log-out.svg?raw";
import bloklar from "lucide-static/icons/blocks.svg?raw";
import robot from "lucide-static/icons/bot.svg?raw";
import kod from "lucide-static/icons/code-xml.svg?raw";
import kep from "lucide-static/icons/graduation-cap.svg?raw";
import canta from "lucide-static/icons/backpack.svg?raw";
import isilti from "lucide-static/icons/sparkles.svg?raw";
import kilit from "lucide-static/icons/lock.svg?raw";
import kisiler from "lucide-static/icons/users.svg?raw";
import okul from "lucide-static/icons/school.svg?raw";
import sagOk from "lucide-static/icons/chevron-right.svg?raw";
import cevrimdisi from "lucide-static/icons/wifi-off.svg?raw";
import uyari from "lucide-static/icons/circle-alert.svg?raw";
import tamam from "lucide-static/icons/circle-check.svg?raw";
import bilgi from "lucide-static/icons/info.svg?raw";
import panel from "lucide-static/icons/layout-dashboard.svg?raw";
import deney from "lucide-static/icons/flask-conical.svg?raw";
import yapboz from "lucide-static/icons/puzzle.svg?raw";
import terminal from "lucide-static/icons/terminal.svg?raw";
import islemci from "lucide-static/icons/cpu.svg?raw";
import indir from "lucide-static/icons/download.svg?raw";
import yazici from "lucide-static/icons/printer.svg?raw";
import grafik from "lucide-static/icons/chart-column.svg?raw";
import saat from "lucide-static/icons/timer.svg?raw";

export const IKONLAR = {
  "ok-sag": okSag, giris: girisIkon, cikis: cikisIkon, bloklar, robot, kod, kep, canta, isilti, kilit, kisiler, okul,
  "sag-ok": sagOk, cevrimdisi, uyari, tamam, bilgi, panel, deney, yapboz, terminal, islemci, indir, yazici, grafik, saat
} as const;
export type IkonAdi = keyof typeof IKONLAR;
