import { describe, expect, test } from "bun:test";
import { parseVideoSource, videoEmbedSource } from "./tutorial-videos.ts";

describe("parseVideoSource", () => {
  test("extracts hosted video IDs and YouTube thumbnails", () => {
    const youtube = parseVideoSource("https://youtu.be/AbcDef12345");
    expect(youtube?.provider).toBe("youtube");
    expect(youtube?.providerId).toBe("AbcDef12345");
    expect(youtube?.thumbnailUrl).toBe("https://img.youtube.com/vi/AbcDef12345/hqdefault.jpg");
    expect(videoEmbedSource(youtube).url).toBe("https://www.youtube-nocookie.com/embed/AbcDef12345");
  });

  test("supports Vimeo, Drive, and direct HTTPS video files", () => {
    expect(parseVideoSource("https://vimeo.com/12345678")?.provider).toBe("vimeo");
    expect(parseVideoSource("https://drive.google.com/file/d/Abc_123456/view")?.provider).toBe("drive");
    expect(parseVideoSource("https://cdn.example.com/lesson.mp4")?.provider).toBe("direct");
  });

  test("rejects unsupported and insecure links", () => {
    expect(parseVideoSource("http://youtu.be/AbcDef12345")).toBeNull();
    expect(parseVideoSource("https://example.com/watch?v=abc")).toBeNull();
  });
});