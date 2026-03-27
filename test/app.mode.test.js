import test from "brittle";
import { getMode, hasStorySelection, isDebugEnabled, isDevMode } from "../src/lib/app/mode.js";

test("app mode: query mode override wins", (t) => {
  t.is(getMode({ search: "?mode=dev", appEnv: "production" }), "dev");
  t.is(getMode({ search: "?mode=play", appEnv: "development" }), "play");
  t.ok(isDevMode({ search: "?mode=dev", appEnv: "production" }));
});

test("app mode: dev alias works", (t) => {
  t.is(getMode({ search: "?dev=1", appEnv: "production" }), "dev");
});

test("app mode: defaults to dev when app env is non-production", (t) => {
  t.is(getMode({ search: "", appEnv: "development" }), "dev");
  t.is(getMode({ search: "", appEnv: "test" }), "dev");
});

test("app mode: defaults to play when app env is production or missing", (t) => {
  t.is(getMode({ search: "", appEnv: "production" }), "play");
  t.is(getMode({ search: "", appEnv: null }), "play");
});

test("app mode: story selection detection", (t) => {
  t.is(hasStorySelection("?story=terminal-dossier"), true);
  t.is(hasStorySelection("?mode=dev"), false);
  t.is(hasStorySelection(""), false);
});

test("app mode: debug query flag works", (t) => {
  t.is(isDebugEnabled("?debug=1"), true);
  t.is(isDebugEnabled("?mode=dev"), false);
});
