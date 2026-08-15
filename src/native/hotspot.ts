/**
 * Native hotspot helpers (Capacitor).
 * Full LocalOnlyHotspot requires a custom Android plugin; web falls back to Settings.
 */

export type HotspotResult =
  | { ok: true; mode: 'native' | 'settings'; ssid?: string; message: string }
  | { ok: false; message: string };

function isNative(): boolean {
  return typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();
}

function platform(): string {
  try {
    return (window as any).Capacitor?.getPlatform?.() ?? 'web';
  } catch {
    return 'web';
  }
}

/**
 * Try to start / open hotspot configuration.
 * - Android native: opens system hotspot panel (plugin hook if present)
 * - iOS: Personal Hotspot cannot be toggled by 3rd-party apps; opens Settings when possible
 * - Web: instructs user (no browser API for hotspot)
 */
export async function startPartyHotspot(): Promise<HotspotResult> {
  if (!isNative()) {
    return {
      ok: false,
      message:
        'Hotspot can only be started from the native app. On web: open phone Settings → Mobile hotspot, then share the party code.',
    };
  }

  const plat = platform();

  // Optional custom plugin: OrangeGrooveHotspot (see android docs)
  try {
    const { registerPlugin } = await import('@capacitor/core');
    const Hotspot = registerPlugin<any>('OrangeGrooveHotspot');
    if (Hotspot?.startLocalOnly) {
      const res = await Hotspot.startLocalOnly();
      return {
        ok: true,
        mode: 'native',
        ssid: res?.ssid,
        message: res?.ssid
          ? `Hotspot active: ${res.ssid}. Guests should join this network, then enter the party code.`
          : 'Local hotspot started. Guests can join, then enter the party code.',
      };
    }
  } catch {
    /* plugin not installed — fall through */
  }

  // Open system settings as reliable fallback
  try {
    if (plat === 'android') {
      // Intent to tether settings (works on most OEMs)
      const { App } = await import('@capacitor/app').catch(() => ({ App: null as any }));
      // Prefer community Settings opener if available
      try {
        const { NativeSettings, AndroidSettings } = await import('capacitor-native-settings');
        // Wireless = Wi-Fi / Bluetooth / Mobile networks screen, which hosts the
        // hotspot & tethering toggle on stock Android.
        await NativeSettings.openAndroid({ option: AndroidSettings.Wireless });
        return {
          ok: true,
          mode: 'settings',
          message: 'Opened hotspot settings. Turn hotspot ON, then share the party code with guests on that network.',
        };
      } catch {
        // Generic app-open fallback message
        void App;
        return {
          ok: true,
          mode: 'settings',
          message:
            'Open Settings → Network → Mobile hotspot and turn it ON. Then share the party code with guests on that Wi‑Fi.',
        };
      }
    }

    if (plat === 'ios') {
      return {
        ok: true,
        mode: 'settings',
        message:
          'On iPhone: Settings → Personal Hotspot → Allow Others to Join. Apple does not allow apps to toggle this automatically.',
      };
    }
  } catch {
    /* ignore */
  }

  return {
    ok: false,
    message: 'Could not open hotspot controls. Enable Mobile hotspot in system Settings, then share the party code.',
  };
}
