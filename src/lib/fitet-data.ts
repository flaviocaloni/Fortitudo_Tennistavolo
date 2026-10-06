// Mock data di atleti da FITET (Lombardia, Generale)
// In futuro integreremo l'API reale

export type Athlete = {
  id: string;
  name: string;
  dateOfBirth?: string; // YYYY-MM-DD (opzionale per risultati FITET)
  ranking: number;
  gender: "M" | "F"; // Maschile/Femminile
  category: "GENERALE" | "MASTER" | "GIOVANILI" | "PARALIMPICI";
  photoUrl?: string; // Da FITET CDN
  source?: "mock" | "fitet_live" | "fitet_fallback"; // Dove viene l'atleta
  profileUrl?: string; // URL diretto al profilo atleta nel portale FITET
  fitetId?: string; // ID originale FITET (non prefissato con 'fitet-')
};

// Mock data - categoria Generale Maschile e Femminile
export const mockAthletes: Athlete[] = [
  // Maschile
  {
    id: "939679",
    name: "FANTONI MATTEO",
    dateOfBirth: "2006-02-05",
    ranking: 1,
    gender: "M",
    category: "GENERALE",
    photoUrl: "https://portale.fitet.org/images/atleti/939679.jpg",
  },
  {
    id: "851362",
    name: "RAGNI LORENZO",
    dateOfBirth: "1998-07-15",
    ranking: 2,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "415810",
    name: "LOMBARDI ANDREA",
    dateOfBirth: "1995-03-22",
    ranking: 3,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "827543",
    name: "GUERRINI STEFANO",
    dateOfBirth: "2000-11-08",
    ranking: 4,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "753821",
    name: "MARGARONE ALBERTO",
    dateOfBirth: "1992-06-12",
    ranking: 5,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "904562",
    name: "CEREA GIACOMO",
    dateOfBirth: "2004-09-30",
    ranking: 6,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "847291",
    name: "SPINICCHIA SIMONE",
    dateOfBirth: "1999-01-17",
    ranking: 7,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "923654",
    name: "NEGRO ROBERTO",
    dateOfBirth: "1997-04-28",
    ranking: 8,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "758214",
    name: "PUGLIESE SALVATORE",
    dateOfBirth: "2002-12-05",
    ranking: 9,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "821937",
    name: "AUSTRIA GIANLUCA",
    dateOfBirth: "2001-08-14",
    ranking: 10,
    gender: "M",
    category: "GENERALE",
  },
  // Femminile
  {
    id: "847362",
    name: "STEFANOVA NIKOLETA",
    dateOfBirth: "1994-11-09",
    ranking: 1,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "954732",
    name: "MOSCONI VERONICA",
    dateOfBirth: "1999-05-22",
    ranking: 2,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "728391",
    name: "WANG XUELAN",
    dateOfBirth: "2000-07-18",
    ranking: 3,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "842756",
    name: "SANCHI CANDELA",
    dateOfBirth: "1998-03-14",
    ranking: 4,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "931827",
    name: "CICUTTINI CECILIA",
    dateOfBirth: "2003-01-31",
    ranking: 5,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "847521",
    name: "BUZZONI MATILDE",
    dateOfBirth: "2005-09-16",
    ranking: 6,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "723891",
    name: "GALLI ALICE",
    dateOfBirth: "1996-12-07",
    ranking: 7,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "958264",
    name: "SEMENZA CRISTINA",
    dateOfBirth: "2001-06-20",
    ranking: 8,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "847923",
    name: "MAGNAGHI ARIANNA",
    dateOfBirth: "1999-10-11",
    ranking: 9,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "621847",
    name: "BENASSI ALESSANDRA",
    dateOfBirth: "1995-02-25",
    ranking: 10,
    gender: "F",
    category: "GENERALE",
  },
  // Aggiunti altri atleti per coprire più cognomi
  {
    id: "847362",
    name: "ROSSI MARCO",
    dateOfBirth: "2001-03-12",
    ranking: 11,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "954723",
    name: "BIANCHI LUCA",
    dateOfBirth: "1999-07-19",
    ranking: 12,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "738291",
    name: "VERDI CARLO",
    dateOfBirth: "2000-11-05",
    ranking: 13,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "842756",
    name: "RUSSO ELENA",
    dateOfBirth: "1998-05-28",
    ranking: 11,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "931827",
    name: "FERRARI GIULIA",
    dateOfBirth: "2002-09-14",
    ranking: 12,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "847521",
    name: "GALLO ANDREA",
    dateOfBirth: "2004-01-30",
    ranking: 14,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "723891",
    name: "BARBIERI SOFIA",
    dateOfBirth: "1996-06-17",
    ranking: 13,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "958264",
    name: "MORETTI DAVIDE",
    dateOfBirth: "2000-04-22",
    ranking: 15,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "847923",
    name: "COLOMBO FRANCESCA",
    dateOfBirth: "1997-12-08",
    ranking: 14,
    gender: "F",
    category: "GENERALE",
  },
  // CALONI athletes
  {
    id: "847362",
    name: "CALONI FLAVIO",
    dateOfBirth: "1985-06-15",
    ranking: 16,
    gender: "M",
    category: "GENERALE",
  },
  {
    id: "954723",
    name: "CALONI GIULIA",
    dateOfBirth: "1992-11-22",
    ranking: 15,
    gender: "F",
    category: "GENERALE",
  },
  {
    id: "738291",
    name: "CALONI ANDREA",
    dateOfBirth: "2003-02-10",
    ranking: 17,
    gender: "M",
    category: "GENERALE",
  },
];

/**
 * Ricerca atleti per nome
 * @param query Testo di ricerca (min. 2 caratteri)
 * @param genderFilter Filtro genere (M, F, o undefined per entrambi)
 * @returns Array di atleti corrispondenti
 */
export function searchAthletes(
  query: string,
  genderFilter?: "M" | "F"
): Athlete[] {
  if (query.length < 2) return [];

  const normalized = query.toUpperCase();
  return mockAthletes
    .filter((athlete) => {
      const matches = athlete.name.includes(normalized);
      const genderMatches = !genderFilter || athlete.gender === genderFilter;
      return matches && genderMatches;
    })
    .slice(0, 15); // Max 15 risultati
}

/**
 * Formatta data di nascita come DD/MM/YYYY
 */
export function formatBirthDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Calcola età da data di nascita
 */
export function getAge(dateStr: string): number {
  const today = new Date();
  const birthDate = new Date(dateStr);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * URL al portale FITET per un atleta
 * Preferisce l'URL diretto al profilo se disponibile, altrimenti fallback a ricerca per nome
 */
export function getFitetProfileUrl(athlete: Athlete): string {
  // Se abbiamo un URL diretto al profilo, usalo
  if (athlete.profileUrl) {
    return athlete.profileUrl;
  }

  // Altrimenti, URL di ricerca sul portale FITET
  const genderId = athlete.gender === "M" ? "1" : "2";
  return `https://portale.fitet.org/risultati/new_rank/testaclassifica_comit.php?ID_CLASS=247&ID=${genderId}&PASS=20&COMIT=4&search=${encodeURIComponent(athlete.name)}`;
}
