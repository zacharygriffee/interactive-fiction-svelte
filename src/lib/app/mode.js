const MODE_DEV = "dev";
const MODE_PLAY = "play";

function getRuntimeSearch() {
  const search = globalThis?.location?.search;
  return typeof search === "string" ? search : "";
}

function getRuntimeAppEnv() {
  const appEnv = globalThis?.__APP_ENV__;
  if (typeof appEnv === "string" && appEnv.length > 0) {
    return appEnv;
  }
  return null;
}

function normalizeMode(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === MODE_DEV || normalized === MODE_PLAY) {
    return normalized;
  }

  return null;
}

function resolveModeOverride(search) {
  const params = new URLSearchParams(search);
  const explicitMode = normalizeMode(params.get("mode"));
  if (explicitMode) {
    return explicitMode;
  }

  const devAlias = params.get("dev");
  if (devAlias === "1") {
    return MODE_DEV;
  }

  return null;
}

function resolveDefaultMode(appEnv) {
  if (typeof appEnv === "string" && appEnv.toLowerCase() !== "production") {
    return MODE_DEV;
  }

  return MODE_PLAY;
}

export function getMode({ search = getRuntimeSearch(), appEnv = getRuntimeAppEnv() } = {}) {
  return resolveModeOverride(search) ?? resolveDefaultMode(appEnv);
}

export function isDevMode(options) {
  return getMode(options) === MODE_DEV;
}

export function hasStorySelection(search = getRuntimeSearch()) {
  const params = new URLSearchParams(search);
  const story = params.get("story");
  return typeof story === "string" && story.length > 0;
}

export function isDebugEnabled(search = getRuntimeSearch()) {
  const params = new URLSearchParams(search);
  return params.get("debug") === "1";
}
