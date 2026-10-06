import { NextRequest, NextResponse } from "next/server";

/**
 * API per ottenere il link diretto al profilo di un atleta FITET
 * Fa una ricerca sul portale e estrae il link al profilo dal primo risultato
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");
  const gender = searchParams.get("gender") || "M";

  if (!name || name.length < 3) {
    return NextResponse.json(
      { error: "Athlete name required (min. 3 chars)" },
      { status: 400 }
    );
  }

  try {
    // Prova la ricerca AJAX FITET
    const fitetUrl = `https://portale.fitet.org/risultati/new_rank/ajax.php?term=${encodeURIComponent(name)}`;
    console.log(`[FITET Profile] Fetching: ${fitetUrl}`);

    const response = await fetch(fitetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
      },
      // @ts-ignore
      rejectUnauthorized: false,
    });

    if (!response.ok) {
      console.error(`[FITET Profile] HTTP Error ${response.status}`);
      return NextResponse.json(
        { error: "Failed to fetch from FITET", profileUrl: null },
        { status: 200 } // Ritorna 200 anche se fallisce per permettere fallback
      );
    }

    const rawText = await response.text();
    let results: any[];

    try {
      results = JSON.parse(rawText);
    } catch {
      console.error(`[FITET Profile] JSON parse failed`);
      return NextResponse.json(
        { error: "Failed to parse FITET response", profileUrl: null },
        { status: 200 }
      );
    }

    if (!Array.isArray(results) || results.length === 0) {
      console.warn(`[FITET Profile] No results found`);
      return NextResponse.json(
        { error: "Athlete not found", profileUrl: null },
        { status: 200 }
      );
    }

    // Estrai il primo risultato e tenta di costruire l'URL del profilo
    const firstResult = results[0];
    const athleteId = firstResult.id;
    const athleteName = firstResult.value;

    if (!athleteId) {
      return NextResponse.json(
        { error: "No ID in result", profileUrl: null },
        { status: 200 }
      );
    }

    // Prova diversi pattern di URL del profilo
    // Pattern 1: ID atleta diretto
    let profileUrl = `https://portale.fitet.org/risultati/new_rank/testaatleta.php?ID_ATLETA=${athleteId}`;

    // Log del profilo trovato
    console.log(`[FITET Profile] Found athlete: ${athleteName} (ID: ${athleteId})`);
    console.log(`[FITET Profile] Profile URL: ${profileUrl}`);

    return NextResponse.json({
      success: true,
      athleteName,
      athleteId,
      profileUrl,
    });
  } catch (error) {
    console.error("[FITET Profile] Error:", error);
    return NextResponse.json(
      { error: "Search failed", profileUrl: null },
      { status: 200 }
    );
  }
}
