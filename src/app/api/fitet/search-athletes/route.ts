import { NextRequest, NextResponse } from "next/server";
import { searchAthletes } from "@/lib/fitet-data";

/**
 * API per ricerca atleti FITET in tempo reale
 * Prova live API di FITET, fallback a mock data se fallisce
 */
export async function POST(request: NextRequest) {
  let query = "";
  let gender: "M" | "F" | undefined;

  try {
    const body = await request.json();
    query = body.query;
    gender = body.gender;

    console.log(`[FITET API] START - Query: "${query}", Gender: ${gender || "all"}`);

    // Minimo 4 caratteri
    if (!query || query.length < 4) {
      console.log(`[FITET API] Query too short (${query.length} chars)`);
      return NextResponse.json(
        { error: "Query must be at least 4 characters", athletes: [] },
        { status: 400 }
      );
    }

    // Tenta ricerca live
    let athletes = await searchLiveFitet(query, gender);
    let source = "fitet_live";

    console.log(`[FITET API] Returning ${athletes.length} athletes from ${source}`);

    return NextResponse.json({
      athletes: athletes.slice(0, 15),
      source,
      query,
      count: athletes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FITET API] Unhandled error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed", athletes: [] },
      { status: 500 }
    );
  }
}

async function searchLiveFitet(query: string, gender?: "M" | "F"): Promise<any[]> {
  try {
    const fitetUrl = `https://portale.fitet.org/risultati/new_rank/ajax.php?term=${encodeURIComponent(query)}`;
    console.log(`[FITET API] Fetching live: ${fitetUrl}`);

    const response = await fetch(fitetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "it-IT,it;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://portale.fitet.org/risultati/new_rank/testaclassifica_comit.php?ID_CLASS=247&ID=1&PASS=20&COMIT=4",
        "X-Requested-With": "XMLHttpRequest",
      },
      // @ts-ignore
      rejectUnauthorized: false,
    });

    console.log(`[FITET API] Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[FITET API] HTTP Error ${response.status}`);
      return [];
    }

    const rawText = await response.text();
    console.log(`[FITET API] Raw response (first 200 chars):`, rawText.substring(0, 200));

    let rawResults: any;
    try {
      rawResults = JSON.parse(rawText);
    } catch (parseError) {
      console.error(`[FITET API] JSON parse failed, response starts with:`, rawText.substring(0, 50));
      return [];
    }

    if (!Array.isArray(rawResults)) {
      console.warn(`[FITET API] Results not an array`);
      return [];
    }

    const athletes = parseFitetApiResults(rawResults, gender);
    console.log(`[FITET API] Live search returned ${athletes.length} athletes`);
    return athletes;
  } catch (error) {
    console.error("[FITET API] Live search error:", error);
    return [];
  }
}

/**
 * Parsa i risultati JSON dall'API FITET ajax.php
 * Array di oggetti: { id, value, label, url?, link? }
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

    // Log completo della struttura per debug
    if (i === 0) {
      console.log(`[FITET Parse] Sample result structure:`, JSON.stringify(result));
    }

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

    // Estrai URL diretto del profilo se disponibile nel JSON
    let profileUrl: string | undefined;
    if (result.url) {
      profileUrl = result.url;
      console.log(`[FITET Parse] Item ${i}: found profile URL from 'url' field`);
    } else if (result.link) {
      profileUrl = result.link;
      console.log(`[FITET Parse] Item ${i}: found profile URL from 'link' field`);
    } else {
      // Prova a costruire URL diretto basato su ID
      // Pattern: https://portale.fitet.org/risultati/new_rank/testaatleta.php?ID_ATLETA=<id>
      profileUrl = `https://portale.fitet.org/risultati/new_rank/testaatleta.php?ID_ATLETA=${id}`;
      console.log(`[FITET Parse] Item ${i}: constructed profile URL from ID`);
    }

    athletes.push({
      id: `fitet-${id}`,
      name: name.trim(),
      ranking: athletes.length + 1,
      gender: gender || "M",
      category: "GENERALE",
      source: "fitet_live",
      dateOfBirth,
      profileUrl,
      fitetId: id, // Mantieni l'ID originale FITET
    });
  }

  console.log(`[FITET Parse] Total athletes parsed: ${athletes.length}`);
  return athletes;
}
