import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Server-side safe env targets with hardcoded direct fallbacks
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "NTZUEYPGNW634N8EYDX4";
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || "98CywEP8U4UP3yBKcPePEDPBmx6ngNayBywMLrMz";

function buildHeaders() {
  const ts = Math.floor(Date.now() / 1000);
  
  // Guard check to protect crypto compiler
  if (!API_KEY || !API_SECRET) {
    throw new Error("API configuration strings are empty or corrupted.");
  }

  const hash = crypto.createHash("sha1")
    .update(API_KEY + API_SECRET + ts)
    .digest("hex");

  return {
    "X-Auth-Date": String(ts),
    "X-Auth-Key": API_KEY,
    "Authorization": hash,
    "User-Agent": "PodcastLeadFinder/1.0",
  };
}

async function searchPodcasts(query, page, maxPerPage) {
  const start = page * maxPerPage;
  const url = `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(query)}&max=${maxPerPage}&start=${start}&fulltext=true`;
  const res = await fetch(url, { method: "GET", headers: buildHeaders() });
  if (!res.ok) throw new Error(`Search API error: ${res.status}`);
  const data = await res.json();
  return data.feeds || [];
}

async function recentFeeds(sinceTimestamp, maxPerPage) {
  const url = `https://api.podcastindex.org/api/1.0/recent/feeds?max=${maxPerPage}&since=${sinceTimestamp}&lang=en`;
  const res = await fetch(url, { method: "GET", headers: buildHeaders() });
  if (!res.ok) throw new Error(`Recent feeds API error: ${res.status}`);
  const data = await res.json();
  return data.feeds || [];
}

function filterAndExtract(feeds, activeDays, minEpisodes) {
  const cutoff = Math.floor(Date.now() / 1000) - activeDays * 86400;
  
  return feeds
    .filter(f => {
      const lastUpdate = f.lastUpdateTime || f.newestItemPubdate || 0;
      const episodeCount = f.episodeCount || 0;
      return lastUpdate >= cutoff && episodeCount >= minEpisodes && !!f.url;
    })
    .map(f => ({
      id: f.id || "",
      name: f.title || "",
      author: f.author || "",
      owner_name: f.ownerName || "",
      episodes: f.episodeCount || 0,
      last_active: f.lastUpdateTime ? new Date(f.lastUpdateTime * 1000).toLocaleDateString() : "",
      website: f.link || "",
      rss_url: f.url || "",
      itunes_id: f.itunesId || "",
      language: f.language || "",
      categories: Object.values(f.categories || {}).join(" | "),
      explicit: f.explicit === 1 ? "yes" : "no",
      description: (f.description || "").replace(/[\r\n,]+/g, " ").slice(0, 150),
    }));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      query = 'business', 
      totalPages = 2, 
      activeDays = 90, 
      minEpisodes = 10,
      includeRecent = true 
    } = body;

    const maxPerPage = 40; 
    let searchFeeds = [];
    let recentFeedsList = [];

    // 1. Fetch Keyword Search
    if (query && query.trim()) {
      for (let p = 0; p < totalPages; p++) {
        const batch = await searchPodcasts(query.trim(), p, maxPerPage);
        searchFeeds.push(...batch);
        if (batch.length < maxPerPage) break;
      }
    }
    const processedSearch = filterAndExtract(searchFeeds, activeDays, minEpisodes);

    // 2. Fetch Recent Feeds (If toggled)
    if (includeRecent) {
      let since = Math.floor(Date.now() / 1000) - activeDays * 86400;
      for (let p = 0; p < totalPages; p++) {
        const batch = await recentFeeds(since, maxPerPage);
        if (!batch.length) break;
        recentFeedsList.push(...batch);
        const oldest = Math.min(...batch.map(f => f.lastUpdateTime || f.newestItemPubdate || since));
        since = oldest - 1;
      }
    }
    const processedRecent = filterAndExtract(recentFeedsList, activeDays, minEpisodes);

    // 3. Combine & Deduplicate
    const combined = [...processedSearch, ...processedRecent];
    const seen = new Set();
    const finalLeads = combined.filter(l => {
      if (!l.rss_url || seen.has(l.rss_url)) return false;
      seen.add(l.rss_url);
      return true;
    });

    return NextResponse.json({ success: true, leads: finalLeads });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}