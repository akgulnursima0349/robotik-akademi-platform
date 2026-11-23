/* Mini sumo ligindeki hazır rakipler (Kenshin). Hepsi Python: çocuklar rakiplerinin kodunu okuyup kendi robotunu geliştirir.
   robot["rakip"] = [sol_yan, sol_on, orta, sag_on, sag_yan] (0/1), robot["kenar"] = [sol, sag] (0/1), robot["zaman"] = ms */
export interface OrnekRobot { kimlik: string; ad: string; aciklama: string; kod: string }

export const ORNEK_ROBOTLAR: OrnekRobot[] = [
  {
    kimlik: "boga", ad: "Boğa", aciklama: "Hep dümdüz saldırır; kenarı görünce geri kaçar.",
    kod: `def hamle(robot):
    if robot["kenar"][0] == 1 or robot["kenar"][1] == 1:
        return -255, -255
    return 255, 255
`
  },
  {
    kimlik: "avci", ad: "Avcı", aciklama: "Yerinde döner, rakibi görünce ona döner ve saldırır.",
    kod: `def hamle(robot):
    sol_yan, sol_on, orta, sag_on, sag_yan = robot["rakip"]
    if robot["kenar"][0] == 1 or robot["kenar"][1] == 1:
        return -255, -120
    if orta == 1:
        return 255, 255
    if sol_on == 1:
        return 120, 255
    if sag_on == 1:
        return 255, 120
    if sol_yan == 1:
        return -200, 200
    if sag_yan == 1:
        return 200, -200
    return 160, -160
`
  },
  {
    kimlik: "kurnaz", ad: "Kurnaz", aciklama: "Önce yana kayıp açı alır, sonra rakibin yanından girer.",
    kod: `def hamle(robot):
    sol_yan, sol_on, orta, sag_on, sag_yan = robot["rakip"]
    if robot["kenar"][0] == 1 or robot["kenar"][1] == 1:
        return -255, -255
    if robot["zaman"] < 350:
        return 255, 60
    if orta == 1 or (sol_on == 1 and sag_on == 1):
        return 255, 255
    if sol_on == 1 or sol_yan == 1:
        return 60, 255
    if sag_on == 1 or sag_yan == 1:
        return 255, 60
    return 200, 120
`
  },
  {
    kimlik: "temkinli", ad: "Temkinli", aciklama: "Rakip önüne gelene kadar bekler, sonra tam güç iter.",
    kod: `def hamle(robot):
    sol_yan, sol_on, orta, sag_on, sag_yan = robot["rakip"]
    if robot["kenar"][0] == 1 or robot["kenar"][1] == 1:
        return -200, -200
    if orta == 1:
        return 255, 255
    if sol_on == 1 or sol_yan == 1:
        return -120, 120
    if sag_on == 1 or sag_yan == 1:
        return 120, -120
    return 0, 0
`
  },
  {
    kimlik: "firildak", ad: "Fırıldak", aciklama: "Ringde daire çizer; rakibi önünde görürse dalar.",
    kod: `def hamle(robot):
    if robot["kenar"][0] == 1:
        return 255, -100
    if robot["kenar"][1] == 1:
        return -100, 255
    if robot["rakip"][2] == 1:
        return 255, 255
    return 230, 150
`
  }
];

/** Ligdeki başlangıç kodu: çocuk buradan başlar. */
export const ILK_ROBOT = `# Kenshin her 20 milisaniyede hamle(robot) fonksiyonunu çalıştırır.
# robot["rakip"]: [sol_yan, sol_on, orta, sag_on, sag_yan]  (rakibi gören sensör 1)
# robot["kenar"]: [sol, sag]  (beyaz kenarı gören zemin sensörü 1)
# Geri dönen iki sayı: sol ve sağ motor gücü, -255 ile 255 arası.

def hamle(robot):
    if robot["kenar"][0] == 1 or robot["kenar"][1] == 1:
        return -255, -255       # kenardayım: geri kaç!
    if robot["rakip"][2] == 1:
        return 255, 255         # rakip tam önümde: it!
    return 150, -150            # rakibi arıyorum: dön
`;
