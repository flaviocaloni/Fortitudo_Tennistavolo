import { NextRequest, NextResponse } from "next/server";

/**
 * API per ricerca atleti FITET in tempo reale
 * Usa l'endpoint API FITET diretto (ajax.php) - no DB, no cache
 */
export async function POST(request: NextRequest) {
  try {
    const { query, gender } = await request.json();

    console.log(`[FITET API] START - Query: "${query}", Gender: ${gender || "all"}`);

    // Minimo 4 caratteri
    if (!query || query.length < 4) {
      console.log(`[FITET API] Query too short (${query.length} chars)`);
      return NextResponse.json(
        { error: "Query must be at least 4 characters", athletes: [] },
        { status: 400 }
      );
    }

    // Usa l'API AJAX di FITET (endpoint autocomplete)
    const fitetUrl = `https://portale.fitet.org/risultati/new_rank/ajax.php?term=${encodeURIComponent(query)}`;
    console.log(`[FITET API] Fetching: ${fitetUrl}`);

    // Fetch da API FITET
    const response = await fetch(fitetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      // Disable SSL verification for FITET (certificate issue)
      // @ts-ignore - Node.js specific option
      rejectUnauthorized: false,
    });

    console.log(`[FITET API] Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[FITET API] HTTP Error ${response.status}`);
      return NextResponse.json(
        { error: `FITET API error: ${response.status}`, athletes: [] },
        { status: 503 }
      );
    }

    // Parse JSON
    let rawResults: any;
    try {
      rawResults = await response.json();
      console.log(`[FITET API] Raw JSON:`, JSON.stringify(rawResults).substring(0, 500));
    } catch (parseError) {
      console.error(`[FITET API] JSON parse error:`, parseError);
      return NextResponse.json(
        { error: "Failed to parse FITET response", athletes: [] },
        { status: 500 }
      );
    }

    // Parse results
    const athletes = parseFitetApiResults(rawResults, gender);
    console.log(`[FITET API] Parsed ${athletes.length} athletes`);

    if (athletes.length === 0) {
      console.warn(`[FITET API] No results found for query: "${query}"`);
    }

    return NextResponse.json({
      athletes: athletes.slice(0, 15),
      source: "fitet_live",
      query,
      count: athletes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FITET API] Unhandled error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed",
        athletes: [],
      },
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
  console.log(`[FITET Parse] Input type: ${typeof results}, isArray: ${Array.isArray(results)}`);

  if (!Array.isArray(results)) {
    console.warn(`[FITET Parse] Results is not an array:`, results);
    return [];
  }

  console.log(`[FITET Parse] Array length: ${results.length}`);

  const athletes: any[] = [];
  const processedIds = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const id = result.id;
    const name = result.value || "";
    const label = result.label || "";

    console.log(`[FITET Parse] Item ${i}: id=${id}, name=${name}, label=${label.substring(0, 50)}`);

    // Evita duplicati per ID
    if (!id || processedIds.has(id)) {
      console.log(`[FITET Parse] Item ${i} skipped: no id or duplicate`);
      continue;
    }
    processedIds.add(id);

    // Estrai data di nascita da label: "NOME (DD/MM/YYYY) [ID]"
    const dateMatch = label.match(/\((\d{2})\/(\d{2})\/(\d{4})\)/);
    let dateOfBirth: string | undefined;
    if (dateMatch) {
      const [_, day, month, year] = dateMatch;
      dateOfBirth = `${year}-${month}-${day}`;
      console.log(`[FITET Parse] Item ${i}: extracted DOB=${dateOfBirth}`);
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

  console.log(`[FITET Parse] Total athletes parsed: ${athletes.length}`);
  return athletes;
}
