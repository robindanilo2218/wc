// World Cup PWA - Core Application Engine v2
// JSON base path: worldcup.json-master/worldcup.json-master/{year}/

let savedScores = {};
try {
  savedScores = JSON.parse(localStorage.getItem('wc_user_scores') || '{}');
} catch (e) {
  console.warn('[State] Failed to parse wc_user_scores from localStorage:', e);
}

// Automatically clear outdated PWA caches in window context to immediately escape Service Worker caching traps
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      if (cacheName !== 'worldcup-biorhythm-v6') {
        caches.delete(cacheName).then(() => {
          console.log(`[Cache System] Programmatically cleared outdated PWA cache: ${cacheName}`);
        });
      }
    });
  });
}

// Load simulation configuration (default all enabled)
let savedConfig = { useElo: true, useBiorhythm: true, usePoisson: true, useHistory: true };
try {
  const loadedConfig = localStorage.getItem('wc_simulation_config');
  if (loadedConfig) {
    savedConfig = { ...savedConfig, ...JSON.parse(loadedConfig) };
  }
} catch (e) {
  console.warn('[State] Failed to load simulation config from localStorage:', e);
}

const state = {
  currentYear: localStorage.getItem('wc_selected_year') || '2026',
  wcData: null,
  teamsData: null,
  stadiumsData: null,
  userScores: savedScores,
  offline: !navigator.onLine,
  simulationConfig: savedConfig
};

const JSON_BASE = 'worldcup.json-master/worldcup.json-master';

// ─── Flag Map ─────────────────────────────────────────────────────────────────
const flagMap = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Czech Republic": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia & Herzegovina": "🇧🇦", "Qatar": "🇶🇦", "Switzerland": "🇨🇭",
  "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "USA": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turkey": "🇹🇷",
  "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨",
  "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Belgium": "🇧🇪", "Egypt": "🇪🇬", "Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "DR Congo": "🇨🇩", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦",
  "Russia": "🇷🇺", "Italy": "🇮🇹", "Chile": "🇨🇱", "Cameroon": "🇨🇲", "Serbia": "🇷🇸",
  "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Poland": "🇵🇱", "Costa Rica": "🇨🇷", "Denmark": "🇩🇰",
  "Hungary": "🇭🇺", "Czech Republic": "🇨🇿", "Slovakia": "🇸🇰", "Romania": "🇷🇴",
  "Bulgaria": "🇧🇬", "Greece": "🇬🇷", "Turkey": "🇹🇷", "Ukraine": "🇺🇦",
  "Nigeria": "🇳🇬", "Cameroon": "🇨🇲", "Senegal": "🇸🇳", "Ghana": "🇬🇭",
  "Angola": "🇦🇴", "Togo": "🇹🇬", "Ivory Coast": "🇨🇮", "Tunisia": "🇹🇳",
  "Algeria": "🇩🇿", "South Korea": "🇰🇷", "Japan": "🇯🇵", "China": "🇨🇳",
  "Iran": "🇮🇷", "Saudi Arabia": "🇸🇦", "Australia": "🇦🇺", "New Zealand": "🇳🇿",
  "United States": "🇺🇸", "Honduras": "🇭🇳", "El Salvador": "🇸🇻", "Cuba": "🇨🇺",
  "Mexico": "🇲🇽", "Trinidad & Tobago": "🇹🇹", "Jamaica": "🇯🇲",
  "Bolivia": "🇧🇴", "Peru": "🇵🇪", "Venezuela": "🇻🇪", "Ecuador": "🇪🇨",
  "Cote d'Ivoire": "🇨🇮",
  // Spanish names
  "Camerún": "🇨🇲", "Catar": "🇶🇦", "España": "🇪🇸", "Túnez": "🇹🇳",
  "Bélgica": "🇧🇪", "Irán": "🇮🇷", "Turquía": "🇹🇷", "Canadá": "🇨🇦",
  "Holanda": "🇳🇱", "Países Bajos": "🇳🇱", "Paises Bajos": "🇳🇱",
  "Corea del Sur": "🇰🇷", "Arabia Saudita": "🇸🇦", "Argelia": "🇩🇿",
  "Costa de Marfil": "🇨🇮", "Curazao": "🇨🇼", "Nueva Zelanda": "🇳🇿",
  "República Checa": "🇨🇿", "Rep. Checa": "🇨🇿", "Sudáfrica": "🇿🇦",
  "Uzbekistán": "🇺🇿", "Alemania": "🇩🇪", "Suiza": "🇨🇭", "Suecia": "🇸🇪",
  "Noruega": "🇳🇴", "Bélgica": "🇧🇪", "Jordania": "🇯🇴", "Croacia": "🇭🇷",
  "Panamá": "🇵🇦", "Portugal": "🇵🇹", "Francia": "🇫🇷", "Brasil": "🇧🇷",
  "Marruecos": "🇲🇦", "Haití": "🇭🇹", "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Uruguay": "🇺🇾", "Japón": "🇯🇵", "Colombia": "🇨🇴", "Polonia": "🇵🇱",
  "Dinamarca": "🇩🇰", "Hungría": "🇭🇺", "Bulgaria": "🇧🇬", "Grecia": "🇬🇷",
  "Ucrania": "🇺🇦", "Nigeria": "🇳🇬", "Angola": "🇦🇴", "Togo": "🇹🇬",
  "China": "🇨🇳", "Australia": "🇦🇺", "Irlanda": "🇮🇪", "Rumania": "🇷🇴",
  "Bolivia": "🇧🇴", "Perú": "🇵🇪", "Venezuela": "🇻🇪", "Chile": "🇨🇱",
  "Costa Rica": "🇨🇷", "Honduras": "🇭🇳", "El Salvador": "🇸🇻", "Cuba": "🇨🇺",
  "Trinidad y Tobago": "🇹🇹", "Jamaica": "🇯🇲", "México": "🇲🇽",
  "Congo DR": "🇨🇩", "DR Congo": "🇨🇩"
};

function getFlag(teamName) {
  if (!teamName) return "🏳️";
  const name = teamName.replace("Selección", "").replace("seleccion", "").trim();
  return flagMap[name] || flagMap[teamName] || "🏳️";
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function getSeededRandom(seedString) {
  let h = 1779033703 ^ seedString.length;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return sfc32(h ^ 0xdeadbeef, h ^ 0xbadcafe, h ^ 0xc0debaabe, h ^ 0xfacefeed);
}

// ─── Real Player Rosters ──────────────────────────────────────────────────────
const realRosters = {
  "Argentina_2022": [
    { num: 1,  name: "Franco Armani",       pos: "Arquero",       dob: "1986-10-16", club: "River Plate (ARG)" },
    { num: 12, name: "Geronimo Rulli",       pos: "Arquero",       dob: "1992-05-20", club: "Villarreal (ESP)" },
    { num: 23, name: "Emiliano Martinez",    pos: "Arquero",       dob: "1992-09-01", club: "Aston Villa (ING)" },
    { num: 2,  name: "Juan Foyth",           pos: "Defensor",      dob: "1998-01-12", club: "Villarreal (ESP)" },
    { num: 3,  name: "Nicolas Tagliafico",   pos: "Defensor",      dob: "1992-08-31", club: "Olympique Lyon (FRA)" },
    { num: 4,  name: "Gonzalo Montiel",      pos: "Defensor",      dob: "1997-01-01", club: "Sevilla FC (ESP)" },
    { num: 6,  name: "German Pezzella",      pos: "Defensor",      dob: "1991-06-27", club: "Real Betis (ESP)" },
    { num: 13, name: "Cristian Romero",      pos: "Defensor",      dob: "1998-04-27", club: "Tottenham (ING)" },
    { num: 19, name: "Nicolas Otamendi",     pos: "Defensor",      dob: "1988-02-12", club: "Benfica (POR)" },
    { num: 25, name: "Lisandro Martinez",    pos: "Defensor",      dob: "1998-01-18", club: "Manchester Utd (ING)" },
    { num: 26, name: "Nahuel Molina",        pos: "Defensor",      dob: "1998-04-06", club: "Atlético Madrid (ESP)" },
    { num: 5,  name: "Leandro Paredes",      pos: "Mediocampista", dob: "1994-06-29", club: "Juventus (ITA)" },
    { num: 7,  name: "Rodrigo De Paul",      pos: "Mediocampista", dob: "1994-05-24", club: "Atlético Madrid (ESP)" },
    { num: 8,  name: "Marcos Acuña",         pos: "Mediocampista", dob: "1991-10-28", club: "Sevilla FC (ESP)" },
    { num: 14, name: "Exequiel Palacios",    pos: "Mediocampista", dob: "1998-10-05", club: "Bayer Leverkusen (ALE)" },
    { num: 16, name: "Thiago Almada",        pos: "Mediocampista", dob: "2001-04-26", club: "Atlanta United (USA)" },
    { num: 17, name: "Alejandro Gomez",      pos: "Mediocampista", dob: "1988-02-15", club: "Sevilla FC (ESP)" },
    { num: 18, name: "Guido Rodriguez",      pos: "Mediocampista", dob: "1994-04-12", club: "Real Betis (ESP)" },
    { num: 20, name: "Alexis Mac Allister",  pos: "Mediocampista", dob: "1998-12-24", club: "Brighton (ING)" },
    { num: 24, name: "Enzo Fernandez",       pos: "Mediocampista", dob: "2001-01-17", club: "Benfica (POR)" },
    { num: 9,  name: "Julian Alvarez",       pos: "Delantero",     dob: "2000-01-31", club: "Man City (ING)" },
    { num: 10, name: "Lionel Messi",         pos: "Delantero",     dob: "1987-06-24", club: "PSG (FRA)" },
    { num: 11, name: "Angel Di Maria",       pos: "Delantero",     dob: "1988-02-14", club: "Juventus (ITA)" },
    { num: 15, name: "Ángel Correa",         pos: "Delantero",     dob: "1995-03-09", club: "Atlético Madrid (ESP)" },
    { num: 21, name: "Paulo Dybala",         pos: "Delantero",     dob: "1993-11-15", club: "Roma (ITA)" },
    { num: 22, name: "Lautaro Martinez",     pos: "Delantero",     dob: "1997-08-22", club: "Inter Milan (ITA)" }
  ],
  "Argentina_2026": [
    { num: 1,  name: "Emiliano Martinez",    pos: "Arquero",       dob: "1992-09-01", club: "Aston Villa (ING)" },
    { num: 12, name: "Geronimo Rulli",       pos: "Arquero",       dob: "1992-05-20", club: "Ajax (HOL)" },
    { num: 23, name: "Walter Benitez",       pos: "Arquero",       dob: "1993-01-12", club: "PSV (HOL)" },
    { num: 2,  name: "Nahuel Molina",        pos: "Defensor",      dob: "1998-04-06", club: "Atlético Madrid (ESP)" },
    { num: 3,  name: "Nicolas Tagliafico",   pos: "Defensor",      dob: "1992-08-31", club: "Olympique Lyon (FRA)" },
    { num: 4,  name: "Gonzalo Montiel",      pos: "Defensor",      dob: "1997-01-01", club: "Sevilla FC (ESP)" },
    { num: 6,  name: "German Pezzella",      pos: "Defensor",      dob: "1991-06-27", club: "Real Betis (ESP)" },
    { num: 13, name: "Cristian Romero",      pos: "Defensor",      dob: "1998-04-27", club: "Tottenham (ING)" },
    { num: 19, name: "Nicolas Otamendi",     pos: "Defensor",      dob: "1988-02-12", club: "Benfica (POR)" },
    { num: 25, name: "Lisandro Martinez",    pos: "Defensor",      dob: "1998-01-18", club: "Manchester Utd (ING)" },
    { num: 26, name: "Facundo Medina",       pos: "Defensor",      dob: "1999-05-21", club: "Lens (FRA)" },
    { num: 5,  name: "Leandro Paredes",      pos: "Mediocampista", dob: "1994-06-29", club: "Roma (ITA)" },
    { num: 7,  name: "Rodrigo De Paul",      pos: "Mediocampista", dob: "1994-05-24", club: "Atlético Madrid (ESP)" },
    { num: 8,  name: "Marcos Acuña",         pos: "Mediocampista", dob: "1991-10-28", club: "Sevilla FC (ESP)" },
    { num: 14, name: "Exequiel Palacios",    pos: "Mediocampista", dob: "1998-10-05", club: "Bayer Leverkusen (ALE)" },
    { num: 16, name: "Thiago Almada",        pos: "Mediocampista", dob: "2001-04-26", club: "Botafogo (BRA)" },
    { num: 17, name: "Nico Paz",             pos: "Mediocampista", dob: "2004-06-19", club: "Como (ITA)" },
    { num: 18, name: "Guido Rodriguez",      pos: "Mediocampista", dob: "1994-04-12", club: "Real Betis (ESP)" },
    { num: 20, name: "Alexis Mac Allister",  pos: "Mediocampista", dob: "1998-12-24", club: "Liverpool (ING)" },
    { num: 24, name: "Enzo Fernandez",       pos: "Mediocampista", dob: "2001-01-17", club: "Chelsea (ING)" },
    { num: 9,  name: "Julian Alvarez",       pos: "Delantero",     dob: "2000-01-31", club: "Atlético Madrid (ESP)" },
    { num: 10, name: "Lionel Messi",         pos: "Delantero",     dob: "1987-06-24", club: "Inter Miami (USA)" },
    { num: 11, name: "Lautaro Martinez",     pos: "Delantero",     dob: "1997-08-22", club: "Inter Milan (ITA)" },
    { num: 15, name: "Alejandro Garnacho",   pos: "Delantero",     dob: "2004-07-01", club: "Man Utd (ING)" },
    { num: 21, name: "Paulo Dybala",         pos: "Delantero",     dob: "1993-11-15", club: "Roma (ITA)" },
    { num: 22, name: "Valentín Castellanos", pos: "Delantero",     dob: "1998-10-18", club: "Lazio (ITA)" }
  ]
};

// ─── Name Pools for Seeded Generation ────────────────────────────────────────
const namePools = {
  spanish: {
    first: ["Santiago","Mateo","Juan","Sebastián","Diego","Luis","Carlos","Javier","Andrés","Gabriel","Enzo","Lautaro","Ángel","Roberto","Rodrigo","Miguel","Joaquín","Felipe","Manuel","Francisco","César","Rafael","Adrián","Álvaro","Sergio"],
    last:  ["Rodríguez","González","Martínez","Gómez","Fernández","López","Díaz","Álvarez","Pérez","Sánchez","Romero","Torres","Ramírez","Molina","Guzmán","Silva","Ortiz","Castro","Rojas","Acosta","Vargas","Reyes","Herrera","Morales","Jiménez"]
  },
  german: {
    first: ["Thomas","Manuel","Toni","Joshua","Lukas","Leon","Kai","Florian","Julian","Mats","Bastian","Oliver","Mario","Marc-André","Ilkay","Serge","Jonas","Max","Nico","Alexander"],
    last:  ["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Kroos","Neuer","Kimmich","Süle","Gnabry","Goretzka","Havertz","Sané","Hummels","Schweinsteiger"]
  },
  french: {
    first: ["Kylian","Antoine","Olivier","Hugo","Lucas","Raphaël","Paul","N'Golo","Karim","Kingsley","Benjamin","Adrien","Jules","Theo","Aurélien","Dayot","Ousmane","Marcus","Randal","William"],
    last:  ["Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Lefebvre","Moreau","Mbappé","Griezmann","Lloris","Varane","Pogba","Kanté","Giroud","Hernández","Tchouaméni","Dembélé"]
  },
  english: {
    first: ["Harry","Jude","Bukayo","Marcus","Jack","Jordan","Raheem","Phil","John","Kyle","Declan","Luke","Kieran","Mason","Trent","Reece","Aaron","Conor","James","Ben"],
    last:  ["Smith","Jones","Taylor","Brown","Williams","Wilson","Johnson","Davies","Kane","Bellingham","Saka","Rashford","Sterling","Foden","Pickford","Stone","Rice","Walker","Trippier","Shaw"]
  },
  portuguese: {
    first: ["Cristiano","Bruno","Bernardo","João","Ruben","Diogo","Gonçalo","Rafael","Vitinha","Otávio","Pepe","Danilo","Rui","José","Francisco","Pedro","Manuel","António","Carlos","Miguel"],
    last:  ["Silva","Santos","Ferreira","Pereira","Oliveira","Costa","Rodrigues","Gomes","Ronaldo","Fernandes","Dias","Neves","Jota","Ramos","Leão","Félix","Cancelo","Mendes","Patrício","Guerreiro"]
  },
  generic: {
    first: ["David","John","Michael","Daniel","Ahmed","Mohamed","Ali","Ivan","Luka","Sam","Min-jae","Heung-min","Sadio","Kalidou","Youssef","Sofyan","Hakim","Nayef","Bono","Hiroki","Wataru","Takehiro"],
    last:  ["Kim","Lee","Park","Salah","Mané","Koulibaly","Ziyech","Hakimi","Amrabat","En-Nesyri","Modrić","Kovačić","Perišić","Gvardiol","Livaković","Son","Yoshida","Endo","Tomiyasu","Doan"]
  }
};

function getPoolForTeam(teamName) {
  const n = teamName.toLowerCase();
  if (/argentina|mexico|uruguay|colombia|paraguay|ecuador|spain|españa|chile|bolivia|peru|venezuela|haiti|panama|cabo verde|curacao|costa rica|panamá|méxico|haití/.test(n)) return namePools.spanish;
  if (/germany|alemania|austria/.test(n)) return namePools.german;
  if (/france|francia|belgium|bélgica|cote d'ivoire|ivory coast|senegal|algeria|argelia|morocco|marruecos/.test(n)) return namePools.french;
  if (/england|inglat|usa|estados unidos|canada|australia|scotland|escocia|new zealand|nueva zelanda|south africa|sudáfrica|ghana/.test(n)) return namePools.english;
  if (/portugal|brazil|brasil/.test(n)) return namePools.portuguese;
  return namePools.generic;
}

function generateRoster(teamName, year) {
  const key = `${teamName}_${year}`;
  if (realRosters[key]) return realRosters[key];

  const pool = getPoolForTeam(teamName);
  const rand = getSeededRandom(key);
  const clubs = [
    "Real Madrid (ESP)","Barcelona (ESP)","Man City (ING)","Liverpool (ING)","Arsenal (ING)",
    "Bayern Munich (ALE)","Dortmund (ALE)","PSG (FRA)","Juventus (ITA)","Inter (ITA)","Milan (ITA)",
    "Benfica (POR)","Porto (POR)","Ajax (HOL)","Boca Juniors (ARG)","River Plate (ARG)",
    "Flamengo (BRA)","Palmeiras (BRA)","LA Galaxy (USA)","Al-Nassr (KSA)","Club América (MEX)",
    "Chelsea (ING)","Atlético Madrid (ESP)","Roma (ITA)","Lazio (ITA)","Sevilla (ESP)"
  ];

  const positions = [
    { pos: "Arquero", count: 3 },
    { pos: "Defensor", count: 8 },
    { pos: "Mediocampista", count: 8 },
    { pos: "Delantero", count: 7 }
  ];

  const roster = [];
  const usedNumbers = new Set([1, 12, 23]);

  positions.forEach(group => {
    for (let i = 0; i < group.count; i++) {
      const fName = pool.first[Math.floor(rand() * pool.first.length)];
      const lName = pool.last[Math.floor(rand() * pool.last.length)];

      let num;
      if (group.pos === "Arquero" && i === 0) num = 1;
      else if (group.pos === "Arquero" && i === 1) num = 12;
      else if (group.pos === "Arquero" && i === 2) num = 23;
      else {
        do { num = Math.floor(rand() * 25) + 2; } while (usedNumbers.has(num));
      }
      usedNumbers.add(num);

      const age = Math.floor(rand() * 20) + 18;
      const birthYear = parseInt(year) - age;
      const birthMonth = String(Math.floor(rand() * 12) + 1).padStart(2, '0');
      const birthDay = String(Math.floor(rand() * 28) + 1).padStart(2, '0');
      const dob = `${birthYear}-${birthMonth}-${birthDay}`;
      const club = clubs[Math.floor(rand() * clubs.length)];

      roster.push({ num, name: `${fName} ${lName}`, pos: group.pos, dob, club });
    }
  });

  return roster.sort((a, b) => a.num - b.num);
}

// ─── Biorhythm Engine ─────────────────────────────────────────────────────────
function calculateBiorhythm(birthDateStr, targetDateStr) {
  const birth = new Date(birthDateStr);
  const target = new Date(targetDateStr);
  const diffDays = (target - birth) / (1000 * 60 * 60 * 24);

  const physical    = Math.sin(2 * Math.PI * diffDays / 23)  * 100;
  const emotional   = Math.sin(2 * Math.PI * diffDays / 28)  * 100;
  const intellectual = Math.sin(2 * Math.PI * diffDays / 33) * 100;

  return {
    physical:     Math.round(physical),
    emotional:    Math.round(emotional),
    intellectual: Math.round(intellectual),
    average:      Math.round((physical + emotional + intellectual) / 3)
  };
}

function calculateTeamBiorhythm(teamName, year, targetDateStr) {
  const roster = generateRoster(teamName, year);
  let totalPhys = 0, totalEmot = 0, totalIntel = 0;
  roster.forEach(p => {
    const b = calculateBiorhythm(p.dob, targetDateStr);
    totalPhys  += b.physical;
    totalEmot  += b.emotional;
    totalIntel += b.intellectual;
  });
  const n = roster.length;
  return {
    physical:     Math.round(totalPhys  / n),
    emotional:    Math.round(totalEmot  / n),
    intellectual: Math.round(totalIntel / n),
    average:      Math.round((totalPhys + totalEmot + totalIntel) / (3 * n))
  };
}

// ─── Team Strength Database (Elo / FIFA power index) ───────────────────────────
const teamStrengths = {
  // English names
  "Argentina": 95, "France": 94, "Brazil": 93, "England": 92, "Spain": 92,
  "Portugal": 91, "Germany": 90, "Netherlands": 89, "Uruguay": 87, "Belgium": 87,
  "Croatia": 87, "Colombia": 86, "Morocco": 86, "USA": 84, "Senegal": 82,
  "Japan": 82, "Ecuador": 82, "Mexico": 81, "Sweden": 81, "Switzerland": 81,
  "Austria": 80, "South Korea": 80, "Turkey": 80, "Ivory Coast": 80, "Czech Republic": 79,
  "Norway": 79, "Australia": 78, "Paraguay": 78, "Egypt": 78, "Algeria": 78,
  "Tunisia": 78, "Canada": 77, "Saudi Arabia": 77, "Bosnia & Herzegovina": 76, "Ghana": 76,
  "Cape Verde": 75, "Uzbekistan": 75, "South Africa": 74, "Iran": 74, "Panama": 74,
  "Scotland": 74, "DR Congo": 73, "Iraq": 72, "Jordan": 72, "Qatar": 71,
  "Curaçao": 64, "Haiti": 64, "New Zealand": 63, "Congo DR": 73,
  
  // Spanish names
  "Francia": 94, "Brasil": 93, "Inglaterra": 92, "España": 92, "Alemania": 90,
  "Países Bajos": 89, "Paises Bajos": 89, "Bélgica": 87, "Croacia": 87, "Marruecos": 86,
  "EE.UU.": 84, "EEUU": 84, "Estados Unidos": 84, "Japón": 82, "México": 81,
  "Suecia": 81, "Suiza": 81, "Corea del Sur": 80, "Turquía": 80, "Costa de Marfil": 80,
  "República Checa": 79, "Rep. Checa": 79, "Noruega": 79, "Egipto": 78, "Argelia": 78,
  "Túnez": 78, "Canadá": 77, "Arabia Saudita": 77, "Cabo Verde": 75, "Uzbekistán": 75,
  "Sudáfrica": 74, "Irán": 74, "Panamá": 74, "Escocia": 74, "Congo RD": 73,
  "Congo R.D.": 73, "República Democrática del Congo": 73, "Jordania": 72,
  "Catar": 71, "Curazao": 64, "Haití": 64, "Nueva Zelanda": 63
};

// ─── Títulos Mundiales Históricos ─────────────────────────────────────────────
const teamWorldCupTitles = {
  "Brazil": 5, "Brasil": 5,
  "Germany": 4, "Alemania": 4,
  "Italy": 4, "Italia": 4,
  "Argentina": 3,
  "France": 2, "Francia": 2,
  "Uruguay": 2,
  "England": 1, "Inglaterra": 1,
  "Spain": 1, "España": 1
};

function getHistoryModifier(team1, team2) {
  if (!state.simulationConfig.useHistory) return 0;
  const t1 = team1.replace("Selección", "").replace("seleccion", "").trim();
  const t2 = team2.replace("Selección", "").replace("seleccion", "").trim();
  const titles1 = teamWorldCupTitles[t1] || teamWorldCupTitles[team1] || 0;
  const titles2 = teamWorldCupTitles[t2] || teamWorldCupTitles[team2] || 0;
  // La tradición pesa: cada copa de diferencia aporta 0.8 puntos de rendimiento comparativo (tope +-3)
  const diff = titles1 - titles2;
  return Math.max(-3, Math.min(3, diff * 0.8));
}

// ─── Calculador de Expectativas (Métricas de Pronóstico) ──────────────────────
function getForecastDetails(team1, team2, date) {
  const year = date.split('-')[0];
  
  // 1. Elo Base
  const strength1 = teamStrengths[team1] || teamStrengths[team1.trim()] || 75;
  const strength2 = teamStrengths[team2] || teamStrengths[team2.trim()] || 75;
  const baseDiff = strength1 - strength2;

  // 2. Biorritmos del plantel
  let bioDiffVal = 0;
  let bio1 = null;
  let bio2 = null;
  try {
    bio1 = calculateTeamBiorhythm(team1, year, date);
    bio2 = calculateTeamBiorhythm(team2, year, date);
    bioDiffVal = bio1.average - bio2.average; // Rango -200 a +200
  } catch (e) {
    // fallback
  }

  // 3. Tradición Histórica
  const t1 = team1.replace("Selección", "").replace("seleccion", "").trim();
  const t2 = team2.replace("Selección", "").replace("seleccion", "").trim();
  const titles1 = teamWorldCupTitles[t1] || teamWorldCupTitles[team1] || 0;
  const titles2 = teamWorldCupTitles[t2] || teamWorldCupTitles[team2] || 0;

  // 4. Modificadores efectivos según la configuración del estado
  const eloMod = baseDiff;
  const bioMod = bioDiffVal / 40;
  const histMod = Math.max(-3, Math.min(3, (titles1 - titles2) * 0.8));

  const effElo = state.simulationConfig.useElo ? eloMod : 0;
  const effBio = state.simulationConfig.useBiorhythm ? bioMod : 0;
  const effHist = state.simulationConfig.useHistory ? histMod : 0;
  
  const performanceDiff = effElo + effBio + effHist;

  // 5. Metas de goles esperadas (lambdas)
  let lambda1 = 1.3 + (performanceDiff / 15);
  let lambda2 = 1.1 - (performanceDiff / 15);
  lambda1 = Math.max(0.2, Math.min(4.0, lambda1));
  lambda2 = Math.max(0.2, Math.min(4.0, lambda2));

  return {
    elo1: strength1,
    elo2: strength2,
    eloDiff: baseDiff,
    bioDiff: bioDiffVal,
    titles1,
    titles2,
    lambda1: lambda1.toFixed(1),
    lambda2: lambda2.toFixed(1),
    activeConfig: { ...state.simulationConfig }
  };
}

// ─── Match Simulation ─────────────────────────────────────────────────────────
function simulateMatchWithBiorhythm(team1, team2, date) {
  const year = date.split('-')[0];
  const bio1 = calculateTeamBiorhythm(team1, year, date);
  const bio2 = calculateTeamBiorhythm(team2, year, date);
  
  // Seeded random based on team names and date to ensure repeatability
  const rand = getSeededRandom(`${team1}_vs_${team2}_${date}`);

  // 1. Get base strengths (ELO)
  const strength1 = state.simulationConfig.useElo ? (teamStrengths[team1] || teamStrengths[team1.trim()] || 75) : 75;
  const strength2 = state.simulationConfig.useElo ? (teamStrengths[team2] || teamStrengths[team2.trim()] || 75) : 75;
  const baseDiff = strength1 - strength2;

  // 2. Biorhythm influence (adds up to +-5 power points based on form)
  let bioModifier = 0;
  if (state.simulationConfig.useBiorhythm) {
    const bioDiff = bio1.average - bio2.average; // range -200 to +200
    bioModifier = (bioDiff / 40); // range -5 to +5
  }

  // 3. Tradition/Heritage influence
  const historyModifier = getHistoryModifier(team1, team2);

  // 4. Final performance difference
  const performanceDiff = baseDiff + bioModifier + historyModifier;

  // 5. Goal expectation (lambdas)
  let lambda1 = 1.3 + (performanceDiff / 15);
  let lambda2 = 1.1 - (performanceDiff / 15);

  // Keep expected goals in realistic bounds
  lambda1 = Math.max(0.2, Math.min(4.0, lambda1));
  lambda2 = Math.max(0.2, Math.min(4.0, lambda2));

  let goals1, goals2;

  if (state.simulationConfig.usePoisson) {
    // Generate goals from expectations using seeded random (Poisson)
    const getPoissonGoals = (lambda, r) => {
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1.0;
      do {
        k++;
        p *= r();
      } while (p > L && k < 10);
      return k - 1;
    };
    goals1 = getPoissonGoals(lambda1, rand);
    goals2 = getPoissonGoals(lambda2, rand);
  } else {
    // Deterministic simulation based on mathematical expectation (exact rounding)
    goals1 = Math.round(lambda1);
    goals2 = Math.round(lambda2);
  }

  // Limit absolute maximum goals to keep it realistic
  goals1 = Math.min(7, goals1);
  goals2 = Math.min(7, goals2);

  return [goals1, goals2];
}

// ─── Data Loading ─────────────────────────────────────────────────────────────
let resolvedBase = null;

async function resolveBasePath() {
  if (resolvedBase) return resolvedBase;
  
  const candidates = [
    'worldcup.json-master/worldcup.json-master',
    'worldcup.json-master',
    '.'
  ];
  
  if (window.location.protocol === 'file:') {
    resolvedBase = candidates[0];
    return resolvedBase;
  }
  
  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate}/1930/worldcup.json`, { method: 'GET' }).catch(() => null);
      if (res && res.ok) {
        resolvedBase = candidate;
        console.log(`[Data Engine] Resolved working base path: ${resolvedBase}`);
        return resolvedBase;
      }
    } catch (e) {
      // Continue
    }
  }
  
  resolvedBase = candidates[0];
  return resolvedBase;
}

function loadScriptDynamic(url, varName) {
  return new Promise((resolve) => {
    if (window[varName] !== undefined) {
      resolve(window[varName]);
      return;
    }
    
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      console.log(`[Data Engine] Script loaded successfully: ${url} (Variable: ${varName})`);
      resolve(window[varName] || null);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

async function loadDataFile(year, jsonFileName, varName) {
  const baseCandidates = [
    'worldcup.json-master/worldcup.json-master',
    'worldcup.json-master',
    '.'
  ];
  
  if (window.location.protocol !== 'file:') {
    const base = await resolveBasePath();
    try {
      const response = await fetch(`${base}/${year}/${jsonFileName}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn(`[Data Engine] Fetch failed for ${jsonFileName}, trying script fallbacks.`, e);
    }
  }
  
  const jsFileName = jsonFileName.replace('.json', '.js');
  for (const base of baseCandidates) {
    const scriptUrl = `${base}/${year}/${jsFileName}`;
    const result = await loadScriptDynamic(scriptUrl, varName);
    if (result) {
      return result;
    }
  }
  
  console.error(`[Data Engine] All methods failed to load data for ${year}/${jsonFileName}`);
  return null;
}

async function loadWorldCupData(year) {
  const varName = `wcData_${year}`;
  let data = await loadDataFile(year, 'worldcup.json', varName);
  
  if (!data) return null;

  // Merge user-stored scores for 2026
  if (year === '2026') {
    data.matches = data.matches.map((match, index) => {
      const saved = state.userScores[`match_${index}`];
      if (saved) {
        match.score = { ft: saved.score };
        if (saved.p) match.score.p = saved.p;
        if (saved.goals1) match.goals1 = saved.goals1;
        if (saved.goals2) match.goals2 = saved.goals2;
      }
      return match;
    });
  }

  state.wcData = data;
  return data;
}

async function loadTeamsData(year) {
  const varName = `wcTeams_${year}`;
  const teams = await loadDataFile(year, 'worldcup.teams.json', varName);
  state.teamsData = teams;
  return teams;
}

async function loadStadiumsData(year) {
  const varName = `wcStadiums_${year}`;
  const stadiums = await loadDataFile(year, 'worldcup.stadiums.json', varName);
  state.stadiumsData = stadiums;
  return stadiums;
}

async function loadStandingsData(year) {
  const varName = `wcStandings_${year}`;
  return await loadDataFile(year, 'worldcup.standings.json', varName);
}

async function loadQualiPlayoffsData(year) {
  const varName = `wcQualiPlayoffs_${year}`;
  return await loadDataFile(year, 'worldcup.quali_playoffs.json', varName);
}


async function loadAllData(year) {
  const [data, teams, stadiums] = await Promise.all([
    loadWorldCupData(year),
    loadTeamsData(year),
    loadStadiumsData(year)
  ]);
  return { data, teams, stadiums };
}

// ─── 2026 Sequential Tournament Simulation Engine ───────────────────────────
function runFull2026Simulation(matches) {
  const userScores = {};
  
  // 1. Simulate Group Stage Matches first
  matches.forEach((match, idx) => {
    const isGroup = match.group || match.round.includes("Matchday");
    if (isGroup) {
      const result = simulateMatchWithBiorhythm(match.team1, match.team2, match.date);
      match.score = { ft: result };
      userScores[`match_${idx}`] = {
        score: result,
        goals1: [],
        goals2: []
      };
    } else {
      delete match.score;
    }
  });

  // 2. Playoff Rounds Simulation sequentially (dynamic resolution makes this extremely clean)
  const playoffRounds = [
    "Round of 32",
    "Round of 16",
    "Quarter-final",
    "Quarter-finals",
    "Semi-final",
    "Semi-finals",
    "Match for third place",
    "Playoff for 3rd Place",
    "Final"
  ];

  playoffRounds.forEach(roundName => {
    matches.forEach((match, idx) => {
      const isMatchRound = match.round === roundName || 
        (roundName === "Round of 16" && match.round === "Eighth-finals");
      if (!isMatchRound) return;

      const team1 = resolvePlayoffTeamName(match.team1, matches);
      const team2 = resolvePlayoffTeamName(match.team2, matches);

      // Simulate
      const result = simulateMatchWithBiorhythm(team1, team2, match.date);
      let s1 = result[0];
      let s2 = result[1];
      let pen = null;

      // Force a winner in case of a draw in playoffs (penalty shootout)
      if (s1 === s2) {
        const rand = getSeededRandom(`${team1}_vs_${team2}_penalties_${match.date}`);
        if (rand() > 0.5) {
          pen = [5, 4];
        } else {
          pen = [4, 5];
        }
      }

      match.score = { ft: [s1, s2] };
      if (pen) match.score.p = pen;

      userScores[`match_${idx}`] = {
        score: [s1, s2],
        goals1: [],
        goals2: []
      };
      if (pen) userScores[`match_${idx}`].p = pen;
    });
  });

  state.userScores = userScores;
  localStorage.setItem('wc_user_scores', JSON.stringify(userScores));
}

function getBestThirdPlaceTeamsForSimulation(standings) {
  const thirds = [];
  const groups = ["A","B","C","D","E","F","G","H","I","J","K","L"];
  groups.forEach(code => {
    const grpStandings = standings[`Group ${code}`];
    if (grpStandings && grpStandings.length >= 3) {
      thirds.push({ ...grpStandings[2], group: code });
    }
  });
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
  return thirds.map(t => t.name);
}

// ─── Standings Calculation ────────────────────────────────────────────────────
function calculateGroupStandings(matches) {
  const standings = {};

  matches.forEach(match => {
    if (!match.group || !match.score || !match.score.ft) return;
    const grp = match.group;
    if (!standings[grp]) standings[grp] = {};

    const t1 = match.team1, t2 = match.team2;
    const s1 = match.score.ft[0], s2 = match.score.ft[1];

    if (!standings[grp][t1]) standings[grp][t1] = { name: t1, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, gd: 0 };
    if (!standings[grp][t2]) standings[grp][t2] = { name: t2, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, gd: 0 };

    const st1 = standings[grp][t1], st2 = standings[grp][t2];
    st1.pj++; st2.pj++;
    st1.gf += s1; st1.gc += s2;
    st2.gf += s2; st2.gc += s1;

    if (s1 > s2)      { st1.pts += 3; st1.pg++; st2.pp++; }
    else if (s1 < s2) { st2.pts += 3; st2.pg++; st1.pp++; }
    else              { st1.pts++; st2.pts++; st1.pe++; st2.pe++; }

    st1.gd = st1.gf - st1.gc;
    st2.gd = st2.gf - st2.gc;
  });

  const sorted = {};
  Object.keys(standings).forEach(group => {
    sorted[group] = Object.values(standings[group]).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd  !== a.gd)  return b.gd  - a.gd;
      return b.gf - a.gf;
    });
  });
  return sorted;
}

function calculateOverallStandings(matches, year) {
  // First, calculate the base group standings for all teams
  const standings = calculateGroupStandings(matches);
  let overall = [];
  Object.keys(standings).forEach(group => {
    standings[group].forEach((team, index) => {
      overall.push({ ...team, group, rankInGroup: index + 1 });
    });
  });

  // If there are no played matches or no group standings, return empty
  if (overall.length === 0) return [];

  // Determine highest round reached by each team in the playoffs
  const teamRounds = {};
  const getRoundVal = (roundName) => {
    if (!roundName) return 0;
    const r = roundName.toLowerCase();
    if (r === 'final' || r.includes('1st place') || r.includes('final tournament')) return 6;
    if (r.includes('third place') || r.includes('3rd place')) return 5;
    if (r.includes('semi')) return 4;
    if (r.includes('quarter') || r.includes('cuartos')) return 3;
    if (r.includes('16') || r.includes('eighth') || r.includes('octavos')) return 2;
    if (r.includes('32') || r.includes('dieciseis')) return 1;
    return 0;
  };

  matches.forEach(m => {
    if (!m.score || !m.score.ft) return; // Only count played matches
    const rVal = getRoundVal(m.round);
    if (rVal === 0) return; // Group stage is handled

    const t1 = resolvePlayoffTeamName(m.team1, matches);
    const t2 = resolvePlayoffTeamName(m.team2, matches);

    if (t1 && t1 !== "Pendiente" && !t1.startsWith("W") && !t1.startsWith("L")) {
      teamRounds[t1] = Math.max(teamRounds[t1] || 0, rVal);
    }
    if (t2 && t2 !== "Pendiente" && !t2.startsWith("W") && !t2.startsWith("L")) {
      teamRounds[t2] = Math.max(teamRounds[t2] || 0, rVal);
    }
  });

  // Now, let's identify the top 4 specifically
  const top4 = getTop4FromTournament(matches, year || state.currentYear);
  const champ = top4[0];
  const runnerUp = top4[1];
  const third = top4[2];
  const fourth = top4[3];

  // Assign rounds and compute total points/goals from all matches (groups + playoffs)
  overall.forEach(t => {
    t.highestRound = 0;
    if (teamRounds[t.name]) {
      t.highestRound = teamRounds[t.name];
    }
    
    // Explicitly set top 4 rank override and stage
    if (t.name === champ) { t.highestRound = 10; t.stage = "Campeón"; }
    else if (t.name === runnerUp) { t.highestRound = 9; t.stage = "Subcampeón"; }
    else if (t.name === third) { t.highestRound = 8; t.stage = "Tercer Puesto"; }
    else if (t.name === fourth) { t.highestRound = 7; t.stage = "Cuarto Puesto"; }
    else {
      const rounds = ["Fase de Grupos", "Dieciseisavos de Final", "Octavos de Final", "Cuartos de Final", "Semifinales"];
      t.stage = rounds[t.highestRound] || "Fase de Grupos";
    }

    // Reset stats to sum all matches played (group + playoff)
    t.pts = 0; t.pj = 0; t.pg = 0; t.pe = 0; t.pp = 0; t.gf = 0; t.gc = 0; t.gd = 0;
  });

  // Recalculate stats summing ALL played matches (including playoffs!)
  const pointsPerWin = parseInt(year || state.currentYear) < 1994 ? 2 : 3;

  matches.forEach(m => {
    if (!m.score || !m.score.ft) return;
    const t1 = resolvePlayoffTeamName(m.team1, matches);
    const t2 = resolvePlayoffTeamName(m.team2, matches);

    const st1 = overall.find(t => t.name === t1);
    const st2 = overall.find(t => t.name === t2);

    if (st1) {
      const s1 = m.score.ft[0], s2 = m.score.ft[1];
      st1.pj++;
      st1.gf += s1; st1.gc += s2;
      if (s1 > s2) { st1.pts += pointsPerWin; st1.pg++; }
      else if (s2 > s1) { st1.pp++; }
      else { st1.pts++; st1.pe++; }
      st1.gd = st1.gf - st1.gc;
    }
    if (st2) {
      const s1 = m.score.ft[0], s2 = m.score.ft[1];
      st2.pj++;
      st2.gf += s2; st2.gc += s1;
      if (s2 > s1) { st2.pts += pointsPerWin; st2.pg++; }
      else if (s1 > s2) { st2.pp++; }
      else { st2.pts++; st2.pe++; }
      st2.gd = st2.gf - st2.gc;
    }
  });

  // Finally, sort overall standings
  overall.sort((a, b) => {
    // 1. Highest round reached
    if (b.highestRound !== a.highestRound) return b.highestRound - a.highestRound;
    // 2. Rank in group (for group stage eliminated teams)
    if (a.highestRound === 0 && b.highestRound === 0 && a.rankInGroup !== b.rankInGroup) {
      return a.rankInGroup - b.rankInGroup;
    }
    // 3. Total points
    if (b.pts !== a.pts) return b.pts - a.pts;
    // 4. Goal difference
    if (b.gd !== a.gd) return b.gd - a.gd;
    // 5. Goals scored
    return b.gf - a.gf;
  });

  return overall;
}

function getTop4FromTournament(matches, year) {
  const finalMatch = matches.find(m => m.round === "Final" || m.round === "Playoff for 1st Place" || m.round === "Final Tournament");
  const thirdMatch = matches.find(m => m.round === "Match for third place" || m.round === "Playoff for 3rd Place");

  let champ = null;
  let runnerUp = null;
  let third = null;
  let fourth = null;

  const getWinnerAndLoser = (match) => {
    if (!match || !match.score || !match.score.ft) return [null, null];
    const s1 = match.score.ft[0];
    const s2 = match.score.ft[1];
    const t1 = resolvePlayoffTeamName(match.team1, matches);
    const t2 = resolvePlayoffTeamName(match.team2, matches);
    if (s1 > s2) return [t1, t2];
    if (s2 > s1) return [t2, t1];
    if (match.score.p) {
      return match.score.p[0] > match.score.p[1] ? [t1, t2] : [t2, t1];
    }
    return [null, null];
  };

  if (finalMatch) {
    const [w, l] = getWinnerAndLoser(finalMatch);
    champ = w;
    runnerUp = l;
  }
  if (thirdMatch) {
    const [w, l] = getWinnerAndLoser(thirdMatch);
    third = w;
    fourth = l;
  }

  // Curated list of top 4 for all historical tournaments
  const historicalTop4 = {
    '2022': ['Argentina', 'France', 'Croatia', 'Morocco'],
    '2018': ['France', 'Croatia', 'Belgium', 'England'],
    '2014': ['Germany', 'Argentina', 'Netherlands', 'Brazil'],
    '2010': ['Spain', 'Netherlands', 'Germany', 'Uruguay'],
    '2006': ['Italy', 'France', 'Germany', 'Portugal'],
    '2002': ['Brazil', 'Germany', 'Turkey', 'South Korea'],
    '1998': ['France', 'Brazil', 'Croatia', 'Netherlands'],
    '1994': ['Brazil', 'Italy', 'Sweden', 'Bulgaria'],
    '1990': ['Germany', 'Argentina', 'Italy', 'England'],
    '1986': ['Argentina', 'Germany', 'France', 'Belgium'],
    '1982': ['Italy', 'Germany', 'Poland', 'France'],
    '1978': ['Argentina', 'Netherlands', 'Brazil', 'Italy'],
    '1974': ['Germany', 'Netherlands', 'Poland', 'Brazil'],
    '1970': ['Brazil', 'Italy', 'Germany', 'Uruguay'],
    '1966': ['England', 'Germany', 'Portugal', 'Soviet Union'],
    '1962': ['Brazil', 'Czechoslovakia', 'Chile', 'Yugoslavia'],
    '1958': ['Brazil', 'Sweden', 'France', 'Germany'],
    '1954': ['Germany', 'Hungary', 'Austria', 'Uruguay'],
    '1950': ['Uruguay', 'Brazil', 'Sweden', 'Spain'],
    '1938': ['Italy', 'Hungary', 'Brazil', 'Sweden'],
    '1934': ['Italy', 'Czechoslovakia', 'Germany', 'Austria'],
    '1930': ['Uruguay', 'Argentina', 'USA', 'Yugoslavia']
  };

  const hist = historicalTop4[year] || [];
  
  return [
    champ || hist[0] || "Por determinar",
    runnerUp || hist[1] || "Por determinar",
    third || hist[2] || "Por determinar",
    fourth || hist[3] || "Por determinar"
  ];
}

// ─── Top Scorers ──────────────────────────────────────────────────────────────
function calculateTopScorers(matches) {
  const scorers = {};
  matches.forEach(match => {
    ['goals1', 'goals2'].forEach((key, i) => {
      const team = i === 0 ? match.team1 : match.team2;
      if (match[key]) {
        match[key].forEach(g => {
          if (!scorers[g.name]) scorers[g.name] = { name: g.name, team, goals: 0, penalties: 0 };
          scorers[g.name].goals++;
          if (g.penalty) scorers[g.name].penalties++;
        });
      }
    });
  });
  return Object.values(scorers).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
}

// ─── 2026 Playoff Resolver ────────────────────────────────────────────────────
function resolvePlayoffTeamsFor2026(matches) {
  const standings = calculateGroupStandings(matches);
  const playoffTeams = {};
  const groups = ["A","B","C","D","E","F","G","H","I","J","K","L"];

  groups.forEach(code => {
    const grpName = `Group ${code}`;
    const grpStandings = standings[grpName];
    if (grpStandings && grpStandings.length >= 2) {
      playoffTeams[`1${code}`] = grpStandings[0].name;
      playoffTeams[`2${code}`] = grpStandings[1].name;
    } else {
      playoffTeams[`1${code}`] = `1${code}`;
      playoffTeams[`2${code}`] = `2${code}`;
    }
    if (grpStandings && grpStandings.length >= 3) {
      playoffTeams[`3${code}`] = grpStandings[2].name;
    } else {
      playoffTeams[`3${code}`] = `3${code}`;
    }
  });

  return playoffTeams;
}

function resolvePlayoffTeamName(teamName, matches) {
  if (!teamName) return "Pendiente";
  if (!teamName.match(/^[0-9]/) && !teamName.startsWith("W") && !teamName.startsWith("L")) {
    return teamName;
  }

  const standings = calculateGroupStandings(matches);
  const placeholders = {};
  const groups = ["A","B","C","D","E","F","G","H","I","J","K","L"];
  
  groups.forEach(code => {
    const grpStandings = standings[`Group ${code}`];
    if (grpStandings && grpStandings.length >= 2) {
      placeholders[`1${code}`] = grpStandings[0].name;
      placeholders[`2${code}`] = grpStandings[1].name;
    }
    if (grpStandings && grpStandings.length >= 3) {
      placeholders[`3${code}`] = grpStandings[2].name;
    }
  });

  const bestThirds = getBestThirdPlaceTeamsForSimulation(standings);
  const thirdPlacePlaceholders = [
    "3A/B/C/D/F", "3C/D/F/G/H", "3C/E/F/H/I", "3E/H/I/J/K",
    "3B/E/F/I/J", "3A/E/H/I/J", "3E/F/G/I/J", "3D/E/I/J/L"
  ];
  thirdPlacePlaceholders.forEach((ph, idx) => {
    placeholders[ph] = bestThirds[idx] || ph;
  });

  if (placeholders[teamName]) return placeholders[teamName];

  const matchWinners = {};
  const matchLosers = {};
  
  matches.forEach(m => {
    if (m.num && m.score && m.score.ft) {
      const s1 = m.score.ft[0];
      const s2 = m.score.ft[1];
      let win = m.team1;
      let los = m.team2;
      if (s2 > s1) {
        win = m.team2;
        los = m.team1;
      } else if (s1 === s2 && m.score.p) {
        if (m.score.p[0] > m.score.p[1]) {
          win = m.team1;
          los = m.team2;
        } else {
          win = m.team2;
          los = m.team1;
        }
      }
      matchWinners[`W${m.num}`] = win;
      matchLosers[`L${m.num}`] = los;
    }
  });

  if (teamName.startsWith("W") && matchWinners[teamName]) {
    return resolvePlayoffTeamName(matchWinners[teamName], matches);
  }
  if (teamName.startsWith("L") && matchLosers[teamName]) {
    return resolvePlayoffTeamName(matchLosers[teamName], matches);
  }

  // Safe fallback Spanish names for non-resolved placeholders
  if (teamName.startsWith("W")) return "Ganador " + teamName.substring(1);
  if (teamName.startsWith("L")) return "Perdedor " + teamName.substring(1);

  return teamName;
}

// ─── Year Selector ────────────────────────────────────────────────────────────
function setupYearSelector(onChangeCallback) {
  const select = document.getElementById('wcYearSelect');
  if (!select) return;

  const years = [
    '2026','2022','2018','2014','2010','2006','2002','1998',
    '1994','1990','1986','1982','1978','1974','1970','1966',
    '1962','1958','1954','1950','1938','1934','1930'
  ];

  select.innerHTML = years.map(y =>
    `<option value="${y}" ${y === state.currentYear ? 'selected' : ''}>Mundial ${y}</option>`
  ).join('');

  select.addEventListener('change', e => {
    const year = e.target.value;
    state.currentYear = year;
    localStorage.setItem('wc_selected_year', year);
    if (onChangeCallback) onChangeCallback(year);
  });
}

// ─── Host Map ─────────────────────────────────────────────────────────────────
const hostMap = {
  '2026': 'Canadá / EE.UU. / México', '2022': 'Catar',
  '2018': 'Rusia',         '2014': 'Brasil',
  '2010': 'Sudáfrica',     '2006': 'Alemania',
  '2002': 'Corea / Japón', '1998': 'Francia',
  '1994': 'Estados Unidos','1990': 'Italia',
  '1986': 'México',        '1982': 'España',
  '1978': 'Argentina',     '1974': 'Alemania Occ.',
  '1970': 'México',        '1966': 'Inglaterra',
  '1962': 'Chile',         '1958': 'Suecia',
  '1954': 'Suiza',         '1950': 'Brasil',
  '1938': 'Francia',       '1934': 'Italia',
  '1930': 'Uruguay'
};

const championsMap = {
  '2022': 'Argentina', '2018': 'France',  '2014': 'Germany',
  '2010': 'Spain',     '2006': 'Italy',   '2002': 'Brazil',
  '1998': 'France',    '1994': 'Brazil',  '1990': 'Germany',
  '1986': 'Argentina', '1982': 'Italy',   '1978': 'Argentina',
  '1974': 'Germany',   '1970': 'Brazil',  '1966': 'England',
  '1962': 'Brazil',    '1958': 'Brazil',  '1954': 'Germany',
  '1950': 'Uruguay',   '1938': 'Italy',   '1934': 'Italy',
  '1930': 'Uruguay'
};

// ─── Offline Banner ───────────────────────────────────────────────────────────
window.addEventListener('online',  () => { state.offline = false; toggleOfflineBanner(false); });
window.addEventListener('offline', () => { state.offline = true;  toggleOfflineBanner(true);  });

function toggleOfflineBanner(show) {
  const banner = document.getElementById('offlineBanner');
  if (banner) banner.classList.toggle('active', show);
}

document.addEventListener('DOMContentLoaded', () => {
  toggleOfflineBanner(!navigator.onLine);
});
