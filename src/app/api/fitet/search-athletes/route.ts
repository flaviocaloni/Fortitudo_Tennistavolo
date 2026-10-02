import { NextRequest, NextResponse } from "next/server";

/**
 * API per ricerca atleti FITET in tempo reale
 * Usa l'endpoint API FITET diretto (ajax.php) - no DB, no cache
 */
export async function POST(request: NextRequest) {
  try {
    const { query, gender } = await request.json();

    // Minimo 4 caratteri
    if (!query || query.length < 4) {
      return NextResponse.json({ athletes: [], source: "none" });
    }

    console.log(`[FITET Search] Query: "${query}", Gender: ${gender || "all"}`);

    // Usa l'API AJAX di FITET (endpoint autocomplete)
    const fitetUrl = `https://portale.fitet.org/risultati/new_rank/ajax.php?term=${encodeURIComponent(query)}`;

    // Fetch da API FITET
    const response = await fetch(fitetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.warn(`[FITET Search] API returned ${response.status}, falling back`);
    }

    let athletes: any[] = [];

    if (response.ok) {
      try {
        const results = await response.json();
        athletes = parseFitetApiResults(results, gender);
        console.log(`[FITET Search] API returned ${athletes.length} athletes`);
      } catch (parseError) {
        console.warn("[FITET Search] JSON parse error:", parseError);
      }
    }

    // Fallback: se nessun risultato, importa mock data
    if (athletes.length === 0) {
      console.log("[FITET Search] No results from API, falling back to mock data");
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
 * Parsa i risultati JSON dall'API FITET ajax.php
 * Array di oggetti: { id, value, label }
 * label contiene: "NOME (DD/MM/YYYY) [ID]"
 */
function parseFitetApiResults(
  results: any[],
  gender?: string
): any[] {
  if (!Array.isArray(results)) return [];

  const athletes: any[] = [];
  const processedIds = new Set<string>();

  for (const result of results) {
    const id = result.id;
    const name = result.value || "";
    const label = result.label || "";

    // Evita duplicati per ID
    if (!id || processedIds.has(id)) continue;
    processedIds.add(id);

    // Estrai data di nascita da label: "NOME (DD/MM/YYYY) [ID]"
    const dateMatch = label.match(/\((\d{2})\/(\d{2})\/(\d{4})\)/);
    let dateOfBirth: string | undefined;
    if (dateMatch) {
      const [_, day, month, year] = dateMatch;
      dateOfBirth = `${year}-${month}-${day}`;
    }

    athletes.push({
      id: `fitet-${id}`,
      name: name.trim(),
      ranking: athletes.length + 1,
      gender: gender || "M",
      category: "GENERALE",
      source: "fitet_live",
      dateOfBirth,
    });
  }

  return athletes;
}
