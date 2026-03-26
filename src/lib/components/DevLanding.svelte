<script>
  import DevMediaGallery from "./DevMediaGallery.svelte";

  let showGallery = $state(false);
  const stories = [
    {
      id: "default",
      title: "Default Story",
      description: "Minimal baseline graph for smoke-testing the runtime and basic branching behavior.",
      tone: "Baseline runtime",
      playHref: "?mode=play&story=default",
      devHref: "?mode=dev&story=default"
    },
    {
      id: "terminal-dossier",
      title: "Terminal Dossier",
      description: "Systems-heavy example with storylets, capability gating, side effects, and reconverging routes.",
      tone: "Branching systems demo",
      playHref: "?mode=play&story=terminal-dossier",
      devHref: "?mode=dev&story=terminal-dossier"
    },
    {
      id: "shinobi-demo",
      title: "Shinobi Demo",
      description: "Investigation slice showing knowledge, inventory, relationships, timers, and history-aware gating.",
      tone: "Narrative game demo",
      playHref: "?mode=play&story=shinobi-demo",
      devHref: "?mode=dev&story=shinobi-demo"
    }
  ];

  function toggleGallery() {
    showGallery = !showGallery;
  }
</script>

<section class="dev-landing">
  <h2>Example Selector</h2>
  <p>
    interactive-fiction-svelte is a Svelte host for a deterministic interactive fiction core.
    Pick an example to play or inspect, then use the runtime and tooling links below for deeper validation.
  </p>

  <div class="story-grid">
    {#each stories as story}
      <article class="story-card">
        <div class="story-copy">
          <p class="story-tone">{story.tone}</p>
          <h3>{story.title}</h3>
          <p>{story.description}</p>
        </div>
        <div class="story-actions">
          <a class="primary" href={story.playHref}>Play</a>
          <a class="secondary" href={story.devHref}>Inspect</a>
        </div>
      </article>
    {/each}
  </div>

  <div class="support-grid">
    <section class="support-card">
      <h3>Docs</h3>
      <p><code>docs/if-dsl-quickstart.md</code> explains the authoring DSL and graph shape.</p>
    </section>

    <section class="support-card">
      <h3>Commands</h3>
      <ul>
        <li><code>npm run validate-graph</code></li>
        <li><code>npm run validate-graph:all</code></li>
        <li><code>npm run validate-assets</code></li>
        <li><code>npm test</code></li>
      </ul>
    </section>
  </div>

  <div class="gallery-toggle">
    <button type="button" onclick={toggleGallery}>
      {showGallery ? "Hide Media Gallery" : "Media Gallery"}
    </button>
  </div>

  {#if showGallery}
    <DevMediaGallery />
  {/if}
</section>

<style>
  .dev-landing {
    border: 1px solid #d8d4ca;
    border-radius: 16px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(247, 242, 231, 0.92)),
      #fafaf7;
    padding: 20px;
    display: grid;
    gap: 16px;
    box-shadow: 0 18px 48px rgba(49, 40, 18, 0.08);
  }

  h2,
  h3,
  p,
  ul {
    margin: 0;
  }

  ul {
    padding-left: 18px;
  }

  a {
    color: #1a4f93;
  }

  .story-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .story-card,
  .support-card {
    display: grid;
    gap: 12px;
    border: 1px solid #d8d0bd;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.86);
    padding: 14px;
  }

  .story-card {
    align-content: space-between;
    min-height: 210px;
  }

  .story-copy {
    display: grid;
    gap: 8px;
  }

  .story-tone {
    color: #7b5b1a;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
    font-weight: 700;
  }

  .story-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .story-actions a {
    text-decoration: none;
    border-radius: 999px;
    padding: 8px 12px;
    font-weight: 600;
  }

  .story-actions .primary {
    background: #243847;
    color: #f7f4ec;
  }

  .story-actions .secondary {
    background: #e7edf2;
    color: #243847;
  }

  .support-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .gallery-toggle button {
    width: fit-content;
    border: 1px solid #c8c1b0;
    border-radius: 999px;
    background: #f3ede0;
    padding: 8px 12px;
  }
</style>
