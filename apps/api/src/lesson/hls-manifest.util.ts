// Pure text-rewriting helpers for serving private HLS manifests: a single
// presigned URL only authorizes one object, but an HLS session needs a
// master playlist -> variant playlists -> many segment files. We rewrite
// every non-comment line of each playlist into an authorized URL instead.

function rewriteLines(
  text: string,
  rewriteLine: (line: string) => string,
): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      return rewriteLine(trimmed);
    })
    .join('\n');
}

// Master playlist lines reference variant playlists (e.g. "720p/index.m3u8")
// — rewritten to point back at our own token-guarded variant endpoint.
export function rewriteMasterManifest(
  text: string,
  buildVariantUrl: (variantLine: string) => string,
): string {
  return rewriteLines(text, buildVariantUrl);
}

// Variant playlist lines reference segment files (e.g. "seg_003.ts") —
// rewritten to individually presigned, direct-to-storage GET URLs.
export async function rewriteVariantManifest(
  text: string,
  buildSegmentUrl: (segmentLine: string) => Promise<string>,
): Promise<string> {
  const lines = text.split('\n');
  const rewritten = await Promise.all(
    lines.map(async (line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      return buildSegmentUrl(trimmed);
    }),
  );
  return rewritten.join('\n');
}
