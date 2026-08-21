import { GAPI_SCRIPT_SRC, GSI_SCRIPT_SRC } from "./config";

let scriptsPromise: Promise<void> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true" || existing.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadPickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.picker) {
      resolve();
      return;
    }
    if (!window.gapi?.load) {
      reject(new Error("Google API script failed to load"));
      return;
    }
    window.gapi.load("picker", {
      callback: () => resolve(),
      ontimeout: () => reject(new Error("Google Picker timed out")),
      timeout: 15_000,
    });
  });
}

export function loadGoogleScripts(): Promise<void> {
  if (!scriptsPromise) {
    scriptsPromise = (async () => {
      await Promise.all([injectScript(GSI_SCRIPT_SRC), injectScript(GAPI_SCRIPT_SRC)]);
      await loadPickerApi();
    })().catch((error) => {
      scriptsPromise = null;
      throw error;
    });
  }
  return scriptsPromise;
}
