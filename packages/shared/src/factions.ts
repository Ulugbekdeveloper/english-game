// Visual families (army culture by region) and historical factions used for bots.
export interface VisualFamily { id: string; nameUz: string; color: [number, number, number]; units: string[] }
export const FAMILIES: VisualFamily[] = [
  { id: 'turkic-mongol', nameUz: "Turkiy-mo'g'ul", color: [140, 47, 40], units: ['otliq kamonchi', 'og‘ir otliq', 'nayzachi', 'tug‘'] },
  { id: 'seljuk', nameUz: 'Saljuqiy-turkman', color: [150, 90, 50], units: ['turk otliq', 'sipohiy'] },
  { id: 'ottoman', nameUz: 'Usmoniy', color: [170, 40, 50], units: ['yanichar', 'sipohiy', "to'p"] },
  { id: 'mamluk', nameUz: 'Mamluk', color: [190, 150, 60], units: ['mamluk og‘ir otliq', 'kamonchi'] },
  { id: 'arab', nameUz: 'Arab-xalifalik', color: [60, 120, 70], units: ['cho‘l otliq', 'nayzachi'] },
  { id: 'persian', nameUz: 'Fors', color: [91, 42, 134], units: ['qizilbosh otliq', 'kataphrakt'] },
  { id: 'west-european', nameUz: "G'arbiy Yevropa", color: [40, 80, 150], units: ['ritsar', 'arbaletchi', 'longbow'] },
  { id: 'byzantine', nameUz: 'Vizantiya', color: [120, 40, 110], units: ['kataphrakt', 'varang'] },
  { id: 'east-european', nameUz: 'Sharqiy Yevropa', color: [150, 60, 70], units: ['gusar', 'drujina'] },
  { id: 'north-european', nameUz: 'Shimoliy Yevropa', color: [70, 100, 140], units: ['qalqon devori', 'highland'] },
  { id: 'mediterranean', nameUz: "O'rta yer dengizi", color: [170, 110, 60], units: ['dengizchi', 'arbaletchi'] },
  { id: 'indian', nameUz: 'Hind', color: [200, 120, 40], units: ['urush fili', 'otliq', 'kamonchi'] },
  { id: 'chinese', nameUz: 'Xitoy', color: [160, 30, 40], units: ['piyoda', 'kamonchi', 'porox'] },
  { id: 'japan-korea', nameUz: 'Yapon-koreys', color: [90, 60, 110], units: ['samuray', 'ashigaru'] },
  { id: 'southeast-asia', nameUz: 'Janubi-sharqiy Osiyo', color: [80, 140, 90], units: ['urush fili', 'kris'] },
  { id: 'west-africa', nameUz: "G'arbiy Afrika", color: [190, 140, 50], units: ['mandinka otliq', 'nayzachi'] },
  { id: 'east-africa', nameUz: 'Sharqiy Afrika', color: [150, 90, 40], units: ['qalqonli piyoda', 'kamonchi'] },
  { id: 'americas', nameUz: 'Amerika', color: [60, 130, 120], units: ['yaguar jangchi', 'palaxmon', 'atlatl'] },
];
export const familyById = (id: string) => FAMILIES.find(f => f.id === id) ?? FAMILIES[0];

/** Regions as [latMin, latMax, lonMin, lonMax] -> family. First match wins; default by continent. */
const REGIONS: [number, number, number, number, string][] = [
  [34, 55, 46, 95, 'turkic-mongol'],      // Central Asia, Kazakh steppe, Volga
  [36, 42, 26, 45, 'ottoman'],            // Anatolia
  [40, 50, 20, 30, 'byzantine'],          // Balkans
  [25, 40, 44, 63, 'persian'],            // Iran
  [22, 37, 25, 36, 'mamluk'],             // Egypt, Levant
  [12, 32, 35, 60, 'arab'],               // Arabia, Iraq
  [5, 36, 60, 92, 'indian'],              // India, Afghanistan east
  [18, 54, 95, 135, 'chinese'],           // China
  [30, 46, 124, 146, 'japan-korea'],
  [-11, 28, 92, 141, 'southeast-asia'],
  [35, 60, -11, 16, 'west-european'],
  [44, 60, 16, 40, 'east-european'],
  [54, 72, -25, 32, 'north-european'],
  [36, 47, 6, 20, 'mediterranean'],
  [4, 28, -18, 25, 'west-africa'],
  [-35, 20, 25, 52, 'east-africa'],
  [-56, 72, -170, -34, 'americas'],
];
export function familyForLonLat(lon: number, lat: number): string {
  for (const [a, b, c, d, id] of REGIONS) if (lat >= a && lat <= b && lon >= c && lon <= d) return id;
  if (lon < -30) return 'americas';
  if (lat < 10 && lon > -20 && lon < 55) return 'east-africa';
  if (lon > 95) return 'chinese';
  return 'turkic-mongol';
}

export interface BotFaction { name: string; family: string; home: [number, number] /* lon, lat */ }
export const BOT_FACTIONS: BotFaction[] = [
  { name: 'Oltin O‘rda', family: 'turkic-mongol', home: [46.5, 47.4] }, { name: 'Chig‘atoy ulusi', family: 'turkic-mongol', home: [76, 39.5] },
  { name: 'Xorazmshohlar', family: 'turkic-mongol', home: [60.6, 41.5] }, { name: 'Qozoq xonligi', family: 'turkic-mongol', home: [68, 48] },
  { name: 'Safaviylar', family: 'persian', home: [51.7, 32.6] }, { name: 'Qoraqo‘yunli', family: 'persian', home: [46.3, 38.1] },
  { name: 'Usmoniylar', family: 'ottoman', home: [29, 41] }, { name: 'Saljuqiylar', family: 'seljuk', home: [33, 39] },
  { name: 'Mamluklar', family: 'mamluk', home: [31.2, 30] }, { name: 'Ayyubiylar', family: 'mamluk', home: [36.3, 33.5] },
  { name: 'Abbosiylar', family: 'arab', home: [44.4, 33.3] }, { name: 'Umaviylar', family: 'arab', home: [39.8, 21.4] },
  { name: 'Vizantiya', family: 'byzantine', home: [22.9, 40.6] }, { name: 'Dehli sultonligi', family: 'indian', home: [77.2, 28.6] },
  { name: 'Vijayanagara', family: 'indian', home: [76.5, 15.3] }, { name: 'Rajputlar', family: 'indian', home: [73.8, 26.9] },
  { name: 'Min sulolasi', family: 'chinese', home: [116.4, 39.9] }, { name: 'Sin sulolasi', family: 'chinese', home: [123.4, 41.8] },
  { name: 'Sengoku Yaponiya', family: 'japan-korea', home: [135.8, 35] }, { name: 'Koryo', family: 'japan-korea', home: [126.5, 38] },
  { name: 'Khmer', family: 'southeast-asia', home: [103.9, 13.4] }, { name: 'Majapahit', family: 'southeast-asia', home: [112.4, -7.6] },
  { name: 'Ayutthaya', family: 'southeast-asia', home: [100.6, 14.4] }, { name: 'Dai Viet', family: 'southeast-asia', home: [105.9, 21] },
  { name: 'Fransiya', family: 'west-european', home: [2.3, 48.9] }, { name: 'Angliya', family: 'west-european', home: [-0.1, 51.5] },
  { name: 'Kastiliya', family: 'west-european', home: [-4, 40.4] }, { name: 'Muqaddas Rim', family: 'west-european', home: [8.7, 50.1] },
  { name: 'Polsha', family: 'east-european', home: [19.9, 50.1] }, { name: 'Kiyev Rusi', family: 'east-european', home: [30.5, 50.5] },
  { name: 'Novgorod', family: 'east-european', home: [31.3, 58.5] }, { name: 'Litva', family: 'east-european', home: [25.3, 54.7] },
  { name: 'Skandinaviya', family: 'north-european', home: [18.1, 59.3] }, { name: 'Shotlandiya', family: 'north-european', home: [-3.2, 56] },
  { name: 'Venetsiya', family: 'mediterranean', home: [12.3, 45.4] }, { name: 'Genuya', family: 'mediterranean', home: [8.9, 44.4] },
  { name: 'Mali', family: 'west-africa', home: [-3, 16.8] }, { name: 'Songhay', family: 'west-africa', home: [0, 16.3] },
  { name: 'Habashiston', family: 'east-africa', home: [38.7, 14.1] }, { name: 'Kongo', family: 'east-africa', home: [14.3, -6.3] },
  { name: 'Kilva', family: 'east-africa', home: [39.5, -9] }, { name: 'Zimbabve', family: 'east-africa', home: [30.9, -20.3] },
  { name: 'Aztek', family: 'americas', home: [-99.1, 19.4] }, { name: 'Inka', family: 'americas', home: [-72, -13.5] },
  { name: 'Maya', family: 'americas', home: [-88.6, 20.7] }, { name: 'Mapuche', family: 'americas', home: [-72.6, -38.7] },
  { name: 'Kaxokiya', family: 'americas', home: [-90.1, 38.7] }, { name: 'Tlaxkala', family: 'americas', home: [-98.2, 19.3] },
];
