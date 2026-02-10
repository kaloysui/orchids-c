import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

    try {
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        cache: 'no-store'
      });

    // 502, 503, 504 are common "offline" or "error" statuses from providers
    if (response.status >= 500) {
      return NextResponse.json({ status: response.status, ok: false });
    }

    return NextResponse.json({ status: response.status, ok: true });
  } catch (error) {
    // If it fails to fetch (DNS, network error), consider it offline
    return NextResponse.json({ status: 500, ok: false, error: "Network error" });
  }
}
