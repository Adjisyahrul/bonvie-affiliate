/**
 * 🌸 TikTok Metrics via tikwm.com (free, no API key needed)
 * POST https://www.tikwm.com/api/
 *
 * Handles both video posts and photo/slideshow posts.
 *
 * Field mapping:
 *   play_count    → Views  (videos) | collect_count fallback for photos
 *   digg_count    → Likes
 *   comment_count → Comments
 *   share_count   → Shares
 */
import axios from "axios";

export interface TikTokMetrics {
  views:    number;
  likes:    number;
  comments: number;
  shares:   number;
  title:    string;
  author:   string;
}

export async function getTikTokMetrics(videoUrl: string): Promise<TikTokMetrics> {
  const cleanUrl = videoUrl.trim().split("?")[0]; // strip query params
  if (!cleanUrl.startsWith("http")) {
    throw new Error(`Invalid TikTok URL: ${videoUrl}`);
  }

  // tikwm.com public API — POST with form-encoded body
  // Add timestamp to discourage aggressive client-side caching
  const response = await axios.post(
    "https://www.tikwm.com/api/",
    new URLSearchParams({
      url:  cleanUrl,
      hd:   "0",
      ts:   String(Date.now()),   // cache-bust hint
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
        "Pragma":        "no-cache",
      },
      timeout: 20_000,
    }
  );

  const { code, msg, data: d } = response.data ?? {};

  if (code !== 0 || !d) {
    throw new Error(`tikwm API error: ${msg ?? "no data"} (URL: ${cleanUrl})`);
  }

  // Photo/slideshow posts: play_count may be 0 or absent — use collect_count as proxy for views
  const isPhoto   = Array.isArray(d.images) && d.images.length > 0;
  const rawViews  = Number(d.play_count ?? 0);
  const views     = isPhoto && rawViews === 0
    ? Number(d.collect_count ?? 0)  // bookmarks as proxy for photo reach
    : rawViews;

  return {
    views,
    likes:    Number(d.digg_count    ?? 0),
    comments: Number(d.comment_count ?? 0),
    shares:   Number(d.share_count   ?? 0),
    title:    String(d.title ?? "").slice(0, 120),
    author:   String(d.author?.unique_id ?? d.author?.nickname ?? ""),
  };
}
