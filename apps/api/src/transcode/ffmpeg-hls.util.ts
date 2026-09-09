import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import * as fs from 'fs';
import * as path from 'path';

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export interface SourceProbe {
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
}

export interface Rendition {
  name: string;
  height: number;
  videoBitrateK: number;
  audioBitrateK: number;
}

// Small ladder appropriate for lecture/screen-share content on a
// single-teacher platform — not the 5-6 rung ladder a large streaming
// service would run, just enough for real adaptive playback.
export const RENDITION_LADDER: Rendition[] = [
  { name: '480p', height: 480, videoBitrateK: 800, audioBitrateK: 96 },
  { name: '720p', height: 720, videoBitrateK: 2000, audioBitrateK: 128 },
  { name: '1080p', height: 1080, videoBitrateK: 4000, audioBitrateK: 128 },
];

export function probeSource(filePath: string): Promise<SourceProbe> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);

      const videoStream = data.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) {
        return reject(new Error('الملف مفيهوش فيديو'));
      }

      const [fpsNum, fpsDen] = (videoStream.r_frame_rate ?? '25/1')
        .split('/')
        .map(Number);

      resolve({
        durationSeconds: Math.round(data.format.duration ?? 0),
        width: videoStream.width ?? 0,
        height: videoStream.height ?? 0,
        fps: fpsDen ? Math.round(fpsNum / fpsDen) : 25,
      });
    });
  });
}

// Only include renditions that don't upscale past the source — no point
// generating a fake 1080p rendition from a 480p source.
export function pickRenditions(sourceHeight: number): Rendition[] {
  const SLACK = 40; // allow near-matches (e.g. 1072p source -> still get 1080p rung)
  const eligible = RENDITION_LADDER.filter((r) => r.height <= sourceHeight + SLACK);
  return eligible.length > 0 ? eligible : [RENDITION_LADDER[0]];
}

export function transcodeRendition(
  inputPath: string,
  outDir: string,
  rendition: Rendition,
  fps: number,
): Promise<void> {
  const renditionDir = path.join(outDir, rendition.name);
  fs.mkdirSync(renditionDir, { recursive: true });
  const gop = Math.max(2 * Math.round(fps || 25), 2);

  // Every flag and its value is its own array entry — fluent-ffmpeg maps
  // each entry to one spawn() argv token, so embedding "-vf scale=..." as
  // a single string is not reliable across versions.
  const outputOptions = [
    '-vf',
    `scale=-2:${rendition.height}`,
    // Some sources (screen recordings especially) use 4:2:2/4:4:4 chroma,
    // which the "main" H.264 profile below cannot encode — normalize to
    // yuv420p unconditionally, which is also what virtually every browser
    // and device expects for HLS playback anyway.
    '-pix_fmt',
    'yuv420p',
    '-preset',
    'veryfast',
    '-profile:v',
    'main',
    '-crf',
    '20',
    '-maxrate',
    `${rendition.videoBitrateK}k`,
    '-bufsize',
    `${rendition.videoBitrateK * 2}k`,
    '-g',
    `${gop}`,
    '-keyint_min',
    `${gop}`,
    '-sc_threshold',
    '0',
    '-b:a',
    `${rendition.audioBitrateK}k`,
    '-ac',
    '2',
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_playlist_type',
    'vod',
    '-hls_flags',
    'independent_segments',
    '-hls_segment_filename',
    toFfmpegPath(path.join(renditionDir, 'seg_%03d.ts')),
  ];

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(outputOptions)
      .output(toFfmpegPath(path.join(renditionDir, 'index.m3u8')))
      .on('error', (err: Error) => reject(err))
      .on('end', () => resolve())
      .run();
  });
}

export function writeMasterPlaylist(outDir: string, renditions: Rendition[]): void {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3'];

  for (const r of renditions) {
    const bandwidth = (r.videoBitrateK + r.audioBitrateK) * 1000;
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolutionFor(r)}`);
    lines.push(`${r.name}/index.m3u8`);
  }

  fs.writeFileSync(path.join(outDir, 'master.m3u8'), lines.join('\n') + '\n');
}

// Forward slashes are unambiguous for ffmpeg's argument parser regardless
// of host OS, avoiding backslash-escaping surprises on Windows dev boxes.
function toFfmpegPath(p: string): string {
  return p.replace(/\\/g, '/');
}

function resolutionFor(r: Rendition): string {
  const width = Math.round(((r.height * 16) / 9 / 2)) * 2;
  return `${width}x${r.height}`;
}
