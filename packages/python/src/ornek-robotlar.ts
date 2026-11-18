/* Ligin hazır rakipleri. Hepsi Python: çocuklar rakiplerinin kodunu okuyup kendi robotunu geliştirir. */
const YARDIMCI = `YONLER = ["kuzey", "doğu", "güney", "batı"]

def don(robot, istenen):
    # İstenen yöne bakıyorsa ilerle, bakmıyorsa en kısa yoldan dön
    if robot["yon"] == istenen:
        return "ileri"
    fark = (YONLER.index(istenen) - YONLER.index(robot["yon"])) % 4
    if fark == 3:
        return "sola"
    return "saga"

def yon_bul(robot, hx, hy):
    if hx > robot["x"]:
        return "doğu"
    if hx < robot["x"]:
        return "batı"
    if hy > robot["y"]:
        return "güney"
    return "kuzey"
`;

export interface OrnekRobot { kimlik: string; ad: string; aciklama: string; kod: string }

export const ORNEK_ROBOTLAR: OrnekRobot[] = [
  {
    kimlik: "uykucu", ad: "Uykucu", aciklama: "Hiç kıpırdamaz. İlk maçın için iyi bir rakip.",
    kod: `def hamle(robot):
    return "bekle"
`
  },
  {
    kimlik: "duvarci", ad: "Duvarcı", aciklama: "Duvara kadar dümdüz gider, sonra sağa döner.",
    kod: `def hamle(robot):
    if robot["onu_acik"]:
        return "ileri"
    return "saga"
`
  },
  {
    kimlik: "zikzak", ad: "Zikzak", aciklama: "Meydanı satır satır tarar, hiçbir kareyi atlamaz.",
    kod: YARDIMCI + `
def hamle(robot):
    x = robot["x"]
    y = robot["y"]
    if y % 2 == 0:
        if x < 8:
            return don(robot, "doğu")
    else:
        if x > 0:
            return don(robot, "batı")
    if y < 8:
        return don(robot, "güney")
    return don(robot, "kuzey")
`
  },
  {
    kimlik: "avci", ad: "Avcı", aciklama: "Her turda en yakın kar topuna koşar.",
    kod: YARDIMCI + `
def hamle(robot):
    hedef = robot["en_yakin_top"]
    if hedef is None:
        return "bekle"
    return don(robot, yon_bul(robot, hedef[0], hedef[1]))
`
  },
  {
    kimlik: "kurnaz", ad: "Kurnaz", aciklama: "Rakibinden önce varabileceği topları seçer.",
    kod: YARDIMCI + `
def uzaklik(x1, y1, x2, y2):
    return abs(x1 - x2) + abs(y1 - y2)

def hamle(robot):
    en_iyi = None
    en_kisa = 100
    for top in robot["toplar"]:
        benim = uzaklik(robot["x"], robot["y"], top[0], top[1])
        onun = uzaklik(robot["rakip_x"], robot["rakip_y"], top[0], top[1])
        if benim <= onun and benim < en_kisa:
            en_iyi = top
            en_kisa = benim
    if en_iyi is None:
        en_iyi = robot["en_yakin_top"]
    if en_iyi is None:
        return "bekle"
    return don(robot, yon_bul(robot, en_iyi[0], en_iyi[1]))
`
  }
];

/** Çocuğun ilk robotu: çalışır ama geliştirilmeyi bekler. */
export const ILK_ROBOT = `# Robotun her turda bu fonksiyonla karar verir.
# Dönebileceğin hamleler: "ileri", "sola", "saga", "bekle"
# robot["x"], robot["y"], robot["yon"], robot["en_yakin_top"], robot["onu_acik"] ...

def hamle(robot):
    if robot["onu_acik"]:
        return "ileri"
    return "sola"
`;
