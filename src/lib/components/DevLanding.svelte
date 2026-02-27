<section class="dev-landing">
  <h2>Developer Landing</h2>
  <p>
    interactive-fiction-svelte is a Svelte host for a deterministic interactive fiction core.
    Use this page to pick a story and run graph/runtime checks.
  </p>

  <h3>Stories</h3>
  <ul>
    <li><a href="?mode=play&story=default">Play default story (Play Mode)</a></li>
    <li><a href="?mode=play&story=terminal-dossier">Play terminal dossier example (Play Mode)</a></li>
    <li><a href="?mode=dev&story=terminal-dossier">Inspect terminal dossier in Dev Mode</a></li>
  </ul>

  <h3>Docs</h3>
  <ul>
    <li><code>docs/if-dsl-quickstart.md</code> (open this file in the repo/editor)</li>
  </ul>

  <h3>Commands</h3>
  <ul>
    <li><code>npm run validate-graph</code></li>
    <li><code>npm run validate-graph:all</code></li>
    <li><code>npm test</code></li>
  </ul>
</section>

<style>
  .dev-landing {
    border: 1px solid #d3d3ce;
    border-radius: 8px;
    background: #fafaf7;
    padding: 14px;
    display: grid;
    gap: 10px;
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
</style>
