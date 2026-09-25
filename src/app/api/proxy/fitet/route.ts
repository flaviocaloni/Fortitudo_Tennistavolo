import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fitetUrl = searchParams.get("url");

    if (!fitetUrl) {
      return NextResponse.json(
        { error: "URL parameter required" },
        { status: 400 }
      );
    }

    // Validate URL is from FITET
    if (!fitetUrl.includes("portale.fitet.org")) {
      return NextResponse.json(
        { error: "Only FITET URLs allowed" },
        { status: 403 }
      );
    }

    const response = await fetch(fitetUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch FITET data",
      },
      { status: 500 }
    );
  }
}
