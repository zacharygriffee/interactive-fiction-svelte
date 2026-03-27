<script>
  import { onMount } from "svelte";
  import NodeView from "./lib/components/NodeView.svelte";
  import ChoiceList from "./lib/components/ChoiceList.svelte";
  import DebugPanel from "./lib/components/DebugPanel.svelte";
  import DevLanding from "./lib/components/DevLanding.svelte";
  import { ACTION_TYPES } from "./lib/story/types.js";
  import { getMode, hasStorySelection, isDebugEnabled, isDevMode } from "./lib/app/mode.js";

  let { pear = null, driver = null } = $props();

  let snapshot = $state(null);
  let errorText = $state("");
  let mode = $state("play");
  let devMode = $state(false);
  let debugMode = $state(false);
  let storySelected = $state(false);
  let showConsole = $state(false);
  let showLockedChoices = $state(false);

  const showLanding = $derived(!storySelected);
  const showRuntime = $derived(!showLanding);
  const canShowConsole = $derived(devMode || debugMode);
  const lastActionSummary = $derived(snapshot?.lastActionSummary ?? null);
  const recentChanges = $derived(snapshot?.recentChanges ?? []);

  onMount(() => {
    const runtimeSearch = typeof globalThis?.location?.search === "string" ? globalThis.location.search : "";
    mode = getMode({ search: runtimeSearch });
    devMode = isDevMode({ search: runtimeSearch });
    debugMode = isDebugEnabled(runtimeSearch);
    storySelected = hasStorySelection(runtimeSearch);
    showConsole = devMode || debugMode;
    showLockedChoices = devMode || debugMode;

    if (!driver || typeof driver.init !== "function") {
      errorText = "Missing StoryDriver instance";
      return;
    }

    const unsubscribe = driver.subscribe((next) => {
      snapshot = next;
    });

    driver.init().catch((error) => {
      errorText = error.message;
    });

    return () => {
      unsubscribe();
    };
  });

  async function onChoose(choiceId) {
    try {
      await driver.dispatch({ type: ACTION_TYPES.CHOOSE, choiceId });
      errorText = "";
    } catch (error) {
      errorText = error.message;
    }
  }

  async function goBack() {
    try {
      await driver.dispatch({ type: ACTION_TYPES.GO_BACK });
      errorText = "";
    } catch (error) {
      errorText = error.message;
    }
  }

  function toggleConsole() {
    showConsole = !showConsole;
  }

  function toggleLockedChoices() {
    showLockedChoices = !showLockedChoices;
  }
</script>

{#if pear}
  <div id="bar"><pear-ctrl></pear-ctrl></div>
{/if}

<main data-mode={mode} class:dev-mode={devMode} class:play-mode={!devMode}>
  {#if devMode}
    <h1>Interactive Fiction Runtime — Dev Mode</h1>
  {/if}

  {#if pear && devMode}
    <p>Pear runtime: {pear.version}</p>
  {/if}

  {#if showLanding}
    <DevLanding />
  {/if}

  {#if errorText}
    <p class="error">{errorText}</p>
  {/if}

  {#if showRuntime}
    {#if snapshot}
      {#if lastActionSummary}
        <section class="action-feedback">
          <div class="action-feedback__header">
            <h3>Recent Outcome</h3>
            {#if canShowConsole}
              <button type="button" class="console-toggle" onclick={toggleConsole}>
                {showConsole ? "Hide Console" : "Show Console"}
              </button>
            {/if}
          </div>
          {#if recentChanges.length > 0}
            <ul>
              {#each recentChanges as line}
                <li>{line}</li>
              {/each}
            </ul>
          {:else}
            <p>No visible changes from the last action.</p>
          {/if}
        </section>
      {:else if canShowConsole}
        <div class="console-actions">
          <button type="button" class="console-toggle" onclick={toggleConsole}>
            {showConsole ? "Hide Console" : "Show Console"}
          </button>
        </div>
      {/if}

      <NodeView node={snapshot.node} visibleStorylets={snapshot.visibleStorylets} />
      <ChoiceList
        choices={snapshot.availableChoices}
        lockedChoices={snapshot.choiceDiagnostics?.unavailable ?? []}
        showLockedChoices={canShowConsole && showLockedChoices}
        onChoose={onChoose}
      />
      {#if canShowConsole}
        <div class="console-actions">
          <button type="button" class="console-toggle" onclick={toggleLockedChoices}>
            {showLockedChoices ? "Hide Locked Choices" : "Show Locked Choices"}
          </button>
        </div>
      {/if}
      <button type="button" onclick={goBack}>Go Back</button>
      {#if canShowConsole && showConsole}
        <DebugPanel snapshot={snapshot} />
      {/if}
    {:else}
      <p>Loading...</p>
    {/if}
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: sans-serif;
    background: #f4f4ef;
    color: #1f1f1f;
  }

  #bar {
    -webkit-app-region: drag;
    background: #2f3b45;
    height: var(--title-bar-height, 32px);
    color: #fff;
    padding: 0 8px;
  }

  main {
    margin: 24px auto;
    padding: 0 16px 32px;
    display: grid;
    gap: 12px;
  }

  .dev-mode {
    max-width: 840px;
  }

  .play-mode {
    max-width: 720px;
  }

  h1 {
    margin: 0;
  }

  .error {
    color: #9c1c1c;
    font-weight: 600;
  }

  .action-feedback,
  .console-actions {
    border: 1px solid #d8d0bd;
    border-radius: 12px;
    background: #fbf8ef;
    padding: 12px;
  }

  .action-feedback__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .action-feedback h3,
  .action-feedback p,
  .action-feedback ul {
    margin: 0;
  }

  .action-feedback {
    display: grid;
    gap: 10px;
  }

  .action-feedback ul {
    padding-left: 18px;
  }

  .console-toggle {
    border: 1px solid #c5bdab;
    border-radius: 999px;
    background: #f1ead9;
    padding: 8px 12px;
  }
</style>
