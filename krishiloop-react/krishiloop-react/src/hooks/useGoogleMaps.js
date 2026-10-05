import { useEffect, useState } from "react";

/* --------------------------------------------------------------------------
   useGoogleMaps
   --------------------------------------------------------------------------
   Loads the Google Maps JavaScript API once and resolves with the
   `google.maps` namespace. The API key is read from localStorage under
   "krishiloop_gmaps_key" — the same convention used by the static
   public/dashboard.html so users only enter their key once across the
   project.

   Returns one of:
     { status: "no-key", google: null }
     { status: "loading", google: null }
     { status: "ready", google }
     { status: "error", google: null, error: string }
   -------------------------------------------------------------------------- */

const KEY_STORAGE = "krishiloop_gmaps_key";
const LIBRARIES = "places,geometry";

let scriptPromise = null;

export function getStoredKey() {
  try { return localStorage.getItem(KEY_STORAGE) || ""; }
  catch { return ""; }
}

export function setStoredKey(value) {
  try {
    if (value) localStorage.setItem(KEY_STORAGE, value);
    else localStorage.removeItem(KEY_STORAGE);
  } catch { /* localStorage unavailable */ }
}

export function clearStoredKey() {
  try { localStorage.removeItem(KEY_STORAGE); } catch { /* */ }
  scriptPromise = null;
}

function loadScript(apiKey) {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      scriptPromise = null;
      return reject(new Error("Window is unavailable"));
    }
    if (window.google?.maps) return resolve(window.google.maps);

    window.__krishiGmapsReady = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else { scriptPromise = null; reject(new Error("Google Maps failed to initialise")); }
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=${LIBRARIES}&loading=async&callback=__krishiGmapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not reach maps.googleapis.com — check network or API key restrictions."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function useGoogleMaps() {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return { status: "loading", google: null };
    const key = getStoredKey();
    if (!key) return { status: "no-key", google: null };
    if (window.google?.maps) return { status: "ready", google: window.google.maps };
    return { status: "loading", google: null };
  });

  useEffect(() => {
    const key = getStoredKey();
    if (!key) {
      setState({ status: "no-key", google: null });
      return;
    }
    if (window.google?.maps) {
      setState({ status: "ready", google: window.google.maps });
      return;
    }
    setState({ status: "loading", google: null });
    loadScript(key)
      .then((google) => setState({ status: "ready", google }))
      .catch((err) => {
        // Surface a useful message in the console for the developer.
        // eslint-disable-next-line no-console
        console.error("[KrishiLoop] Google Maps load failed:", err);
        setState({ status: "error", google: null, error: err.message });
      });
  }, []);

  return state;
}