export type VideoProvider = "youtube" | "vimeo" | "drive" | "direct";

export type ParsedVideoSource = {
  provider: VideoProvider;
  providerId: string;
  url: string;
  thumbnailUrl: string | null;
};

function allowedHttpsUrl(raw: string) {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Recognizes common hosted lesson links and rejects unsupported or insecure URLs. */
export function parseVideoSource(raw: string): ParsedVideoSource | null {
  const url = allowedHttpsUrl(raw);
  if (!url) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) {
    const id = host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.searchParams.get("v") ?? url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return {
      provider: "youtube",
      providerId: id,
      url: url.toString(),
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/\/(?:video\/)?(\d{6,12})(?:\/|$)/)?.[1];
    if (!id) return null;
    return { provider: "vimeo", providerId: id, url: url.toString(), thumbnailUrl: null };
  }

  if (host === "drive.google.com" || host === "docs.google.com") {
    const id = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/)?.[1] ?? url.searchParams.get("id");
    if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
    return { provider: "drive", providerId: id, url: url.toString(), thumbnailUrl: null };
  }

  if (/\.(mp4|webm|ogg|mov)(?:$)/i.test(url.pathname)) {
    return { provider: "direct", providerId: url.toString(), url: url.toString(), thumbnailUrl: null };
  }

  return null;
}

export function videoSourceUrl(video: {
  provider: string;
  provider_id: string;
  provider_url: string | null;
}) {
  if (video.provider_url) return video.provider_url;
  if (video.provider === "youtube") return `https://youtu.be/${video.provider_id}`;
  if (video.provider === "vimeo") return `https://vimeo.com/${video.provider_id}`;
  if (video.provider === "drive") return `https://drive.google.com/file/d/${video.provider_id}/view`;
  return video.provider_id;
}

export function videoEmbedSource(source: ParsedVideoSource) {
  if (source.provider === "youtube") return { kind: "embed" as const, url: `https://www.youtube-nocookie.com/embed/${source.providerId}` };
  if (source.provider === "vimeo") return { kind: "embed" as const, url: `https://player.vimeo.com/video/${source.providerId}` };
  if (source.provider === "drive") return { kind: "embed" as const, url: `https://drive.google.com/file/d/${source.providerId}/preview` };
  return { kind: "file" as const, url: source.url };
}