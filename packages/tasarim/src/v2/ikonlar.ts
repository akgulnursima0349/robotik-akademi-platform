/* v2 çizgi ikonları (lucide). Yalnız kullanılanlar paketlenir. */
import bilgisayar from "lucide-static/icons/monitor.svg?raw";
import yapboz from "lucide-static/icons/puzzle.svg?raw";
import terminal from "lucide-static/icons/terminal.svg?raw";
import kod from "lucide-static/icons/code-xml.svg?raw";
import islemci from "lucide-static/icons/cpu.svg?raw";
import robot from "lucide-static/icons/bot.svg?raw";
import oynat from "lucide-static/icons/play.svg?raw";
import yildiz from "lucide-static/icons/star.svg?raw";
import tamam from "lucide-static/icons/check.svg?raw";
import geri from "lucide-static/icons/chevron-left.svg?raw";
import ileri from "lucide-static/icons/arrow-right.svg?raw";
import ses from "lucide-static/icons/volume-2.svg?raw";
import ampul from "lucide-static/icons/lightbulb.svg?raw";
import kilit from "lucide-static/icons/lock.svg?raw";
import hata from "lucide-static/icons/circle-alert.svg?raw";
import basari from "lucide-static/icons/circle-check.svg?raw";
import bilgi from "lucide-static/icons/info.svg?raw";
import yukleniyor from "lucide-static/icons/loader-circle.svg?raw";
import menu from "lucide-static/icons/menu.svg?raw";
import kapat from "lucide-static/icons/x.svg?raw";
import cikis from "lucide-static/icons/log-out.svg?raw";
import giris from "lucide-static/icons/log-in.svg?raw";
import panel from "lucide-static/icons/layout-dashboard.svg?raw";
import okul from "lucide-static/icons/school.svg?raw";

export const IKONLAR2 = { bilgisayar, yapboz, terminal, kod, islemci, robot, oynat, yildiz, tamam, geri, ileri, ses, ampul, kilit, hata, basari, bilgi, yukleniyor, menu, kapat, cikis, giris, panel, okul } as const;
export type Ikon2 = keyof typeof IKONLAR2;
