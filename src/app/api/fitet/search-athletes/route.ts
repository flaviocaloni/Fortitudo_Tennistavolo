import { NextRequest, NextResponse } from "next/server";

/**
 * API per ricerca atleti FITET in tempo reale
 * Scraping dal portale FITET - no DB, no cache
 */
export async function POST(request: NextRequest) {
  try {
    const { query, gender } = await request.json();

    // Minimo 4 caratteri
    if (!query || query.length < 4) {
      return NextResponse.json({ athletes: [], source: "none" });
    }

    console.log(`[FITET Search] Query: "${query}", Gender: ${gender || "all"}`);

    // Costruisci URL FITET
    const genderId = gender === "F" ? "2" : "1";
    const fitetUrl = `https://portale.fitet.org/risultati/new_rank/testaclassifica_comit.php?ID_CLASS=247&ID=${genderId}&PASS=20&COMIT=4`;

    // Fetch pagina FITET
    const response = await fetch(fitetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error("[FITET Search] Fetch failed:", response.status);
      return NextResponse.json(
        { error: "FITET unavailable", athletes: [] },
        { status: 503 }
      );
    }

    const html = await response.text();

    // Parsing manual (senza dipendenze esterne)
    let athletes = parseAthletesFromHTML(html, query, gender);

    console.log(`[FITET Search] Found ${athletes.length} athletes from scraping`);

    // Fallback: se nessun risultato, importa mock data come fallback
    if (athletes.length === 0) {
      console.log("[FITET Search] No results from FITET, falling back to mock data");
      // Importa mock data - nota: questo è un fallback temporaneo
      const { searchAthletes } = await import("@/lib/fitet-data");
      const mockResults = searchAthletes(query, gender);
      athletes = mockResults.map((a) => ({
        ...a,
        source: "mock_fallback",
      }));
      console.log(`[FITET Search] Mock fallback returned ${athletes.length} athletes`);
    }

    return NextResponse.json({
      athletes: athletes.slice(0, 15),
      source: athletes[0]?.source || "unknown",
      query,
      count: athletes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FITET Search] Error:", error);
    return NextResponse.json(
      { error: "Search failed", athletes: [] },
      { status: 500 }
    );
  }
}

/**
 * Estrae atleti dall'HTML FITET tramite regex e parsing
 */
function parseAthletesFromHTML(
  html: string,
  query: string,
  gender?: string
): any[] {
  const athletes: any[] = [];
  const queryUpper = query.toUpperCase();

  // Regex per trovare righe di atleti
  // Pattern: numero | nome | altri campi
  // Es: <td>1</td><td>FANTONI MATTEO</td>
  const athletePattern =
    /<td[^>]*>(\d+)<\/td>\s*<td[^>]*>([^<]+?)\s*([A-Z\s]+?)<\/td>/g;

  let match;
  let processedNames = new Set<string>();

  while ((match = athletePattern.exec(html)) !== null) {
    const ranking = parseInt(match[1]) || 0;
    const fullName = match[2]?.trim() || "";
    const nameFormatted = fullName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    // Filtra per query
    if (nameFormatted.toUpperCase().includes(queryUpper)) {
      // Evita duplicati
      if (!processedNames.has(nameFormatted)) {
        processedNames.add(nameFormatted);

        athletes.push({
          id: `fitet-${nameFormatted}-${ranking}`,
          name: nameFormatted,
          ranking: ranking || 999,
          gender: gender || "M",
          category: "GENERALE",
          source: "fitet",
          dateOfBirth: undefined, // FITET HTML non include DOB
        });
      }
    }
  }

  // Fallback: ricerca semplice nel testo
  if (athletes.length === 0) {
    const lines = html.split("\n");
    for (const line of lines) {
      if (line.includes(queryUpper)) {
        // Estrai nome se contiene il pattern
        const nameMatch = line.match(/>([A-Z\s]{4,})<\/[tp]/);
        if (nameMatch && !processedNames.has(nameMatch[1])) {
          const name = nameMatch[1].trim();
          processedNames.add(name);
          athletes.push({
            id: `fitet-${name}`,
            name,
            ranking: athletes.length + 1,
            gender: gender || "M",
            category: "GENERALE",
            source: "fitet_fallback",
          });
        }
      }
    }
  }

  return athletes;
}
