/**
 * Ambient types for native helpers.
 *
 * The Capacitor plugins used by the app are real npm dependencies now
 * (@capacitor-community/keep-awake, capacitor-native-settings, @capacitor/app)
 * and ship their own types. vite.config.ts swaps them for empty stubs only in
 * web builds (mode !== 'native') so the browser bundle stays lean.
 *
 * The optional OrangeGrooveHotspot Android plugin is registered at runtime via
 * `registerPlugin` in src/native/hotspot.ts, so no ambient declaration is
 * required here.
 */
export {};
