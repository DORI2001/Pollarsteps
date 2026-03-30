import { NextResponse } from "next/server";

const YT_API_KEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json({ items: [] });
  }

  if (!YT_API_KEY) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("key", YT_API_KEY);

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "YouTube search failed", detail: text || response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const items = (data.items || [])
      .map((item: any) => {
        const videoId = item?.id?.videoId;
        if (!videoId) return null;
        const snippet = item.snippet || {};
        const thumbnail =
          snippet?.thumbnails?.medium?.url ||
          snippet?.thumbnails?.default?.url ||
          null;

        return {
          id: videoId,
          title: snippet.title,
          channel: snippet.channelTitle,
          thumbnail,
          provider: "youtube",
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[api/music/search] Failed to search YouTube:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
