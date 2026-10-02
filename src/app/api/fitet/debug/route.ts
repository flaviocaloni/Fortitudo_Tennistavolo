import { NextResponse } from "next/server";

/**
 * Debug endpoint - mostra l'HTML grezzo da FITET
 * Usa per debuggare il web scraping
 */
export async function GET() {
  try {
    // Richiesta a FITET per categoria maschile
    const fitetUrl = `https://portale.fitet.org/risultati/new_rank/testaclassifica_comit.php?ID_CLASS=247&ID=1&PASS=20&COMIT=4`;

    const response = await fetch(fitetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `FITET returned ${response.status}` },
        { status: 503 }
      );
    }

    const html = await response.text();

    // Analisi semplice
    const analysis = {
      htmlSize: html.length,
      containsCaloni: html.includes("CALONI"),
      containsTd: html.match(/<td/g)?.length || 0,
      // Estrai primi 5000 caratteri per debug
      htmlSample: html.substring(0, 5000),
      // Cerca pattern di nomi
      namesFound: extractNamesSimple(html),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[FITET Debug]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function extractNamesSimple(html: string): string[] {
  const names: string[] = [];

  // Cerca righe con CALONI
  const lines = html.split("\n");
  for (const line of lines) {
    if (line.includes("CALONI")) {
      // Pulisci i tag HTML
      const clean = line.replace(/<[^>]*>/g, "").trim();
      if (clean.length > 0) {
        names.push(clean);
      }
    }
  }

  return names.slice(0, 20);
}
