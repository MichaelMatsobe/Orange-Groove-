/**
 * Probe local audio files for duration (and best-effort title).
 * Uses the browser media engine — no heavy ID3 dependency.
 */

export interface AudioProbeResult {
  duration: number;
  title: string;
  artist: string;
}

function baseTitle(file: File, fallbackIndex: number): string {
  const raw = file.name.replace(/\.[^/.]+$/, '').trim();
  return raw || `Local Track ${fallbackIndex + 1}`;
}

/**
 * Read duration via HTMLAudioElement metadata.
 * Resolves quickly; falls back to 180s if the browser cannot decode.
 */
export function probeAudioFile(file: File, index = 0): Promise<AudioProbeResult> {
  const title = baseTitle(file, index);
  const artist = 'Local File';

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let settled = false;

    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
      const d = Number.isFinite(duration) && duration > 0 ? duration : 180;
      resolve({ duration: d, title, artist });
    };

    const timer = window.setTimeout(() => finish(180), 8000);

    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      window.clearTimeout(timer);
      finish(audio.duration);
    };
    audio.onerror = () => {
      window.clearTimeout(timer);
      finish(180);
    };
    audio.src = url;
  });
}

export async function probeAudioFiles(files: File[]): Promise<AudioProbeResult[]> {
  const out: AudioProbeResult[] = [];
  for (let i = 0; i < files.length; i++) {
    out.push(await probeAudioFile(files[i], i));
  }
  return out;
}
