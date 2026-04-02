function createPearApi() {
  const runtime = globalThis.Pear;
  if (!runtime) {
    return null;
  }
  return {
    reload: () => runtime.reload?.(),
    version: runtime.version ?? "unknown"
  };
}

async function renderApp(target) {
  try {
    const { mountApp } = await import("./entry.js");
    mountApp({
      target,
      props: {
        pear: createPearApi()
      }
    });
  } catch (error) {
    console.error("Failed to load UI bundle", error);
  }
}

function bootstrap() {
  const target = document.getElementById("app");
  if (!target) {
    throw new Error("Missing #app mount point");
  }
  renderApp(target);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
