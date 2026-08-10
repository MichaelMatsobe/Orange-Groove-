/**
 * Background / lock-screen audio helpers.
 * Web: Media Session API (implemented in App via updateMediaSession).
 * Native: document requirements for Capacitor plugins (optional install).
 */

export interface MediaSessionTrack {
  title: string;
  artist: string;
  coverUrl?: string;
  duration?: number;
}

export function updateMediaSession(
  track: MediaSessionTrack,
  handlers: {
    play?: () => void;
    pause?: () => void;
    next?: () => void;
    previous?: () => void;
    seek?: (time: number) => void;
  }
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'Orange Groove',
      artwork: track.coverUrl
        ? [
            { src: track.coverUrl, sizes: '300x300', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });

    const set = (action: MediaSessionAction, fn?: () => void) => {
      try {
        if (fn) navigator.mediaSession.setActionHandler(action, fn);
        else navigator.mediaSession.setActionHandler(action, null);
      } catch {
        /* some browsers reject certain actions */
      }
    };

    set('play', handlers.play);
    set('pause', handlers.pause);
    set('nexttrack', handlers.next);
    set('previoustrack', handlers.previous);
    if (handlers.seek) {
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime != null) handlers.seek!(details.seekTime);
        });
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* Media Session unsupported */
  }
}

export function setMediaSessionPlayback(state: 'none' | 'paused' | 'playing'): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    /* ignore */
  }
}

/**
 * Native background playback guidance (Capacitor).
 * Install when packaging: @capacitor-community/keep-awake and/or
 * platform-specific background audio modes (iOS UIBackgroundModes audio).
 */
export async function enableNativeBackgroundAudio(): Promise<string> {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (!cap?.isNativePlatform?.()) {
    return 'Web: use Media Session + keep the tab active for best results.';
  }
  try {
    const keepAwake = await import('@capacitor-community/keep-awake').catch(() => null);
    if (keepAwake?.KeepAwake?.keepAwake) {
      await keepAwake.KeepAwake.keepAwake();
      return 'Screen keep-awake enabled for continuous playback.';
    }
  } catch {
    /* optional plugin */
  }
  return 'Native: enable Background Modes → Audio in Xcode; on Android use a foreground service plugin for long background play.';
}
