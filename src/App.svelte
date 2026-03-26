<script>
  import { onMount } from "svelte";
  import NodeView from "./lib/components/NodeView.svelte";
  import ChoiceList from "./lib/components/ChoiceList.svelte";
  import DebugPanel from "./lib/components/DebugPanel.svelte";
  import DevLanding from "./lib/components/DevLanding.svelte";
  import { ACTION_TYPES } from "./lib/story/types.js";
  import { getMode, hasStorySelection, isDevMode } from "./lib/app/mode.js";

  let { pear = null, driver = null } = $props();

  let snapshot = $state(null);
  let errorText = $state("");
  let mode = $state("play");
  let devMode = $state(false);
  let storySelected = $state(false);

  const showLanding = $derived(!storySelected);
  const showRuntime = $derived(!showLanding);

  onMount(() => {
    const runtimeSearch = typeof globalThis?.location?.search === "string" ? globalThis.location.search : "";
    mode = getMode({ search: runtimeSearch });
    devMode = isDevMode({ search: runtimeSearch });
    storySelected = hasStorySelection(runtimeSearch);

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
      <NodeView node={snapshot.node} visibleStorylets={snapshot.visibleStorylets} />
      <ChoiceList choices={snapshot.availableChoices} onChoose={onChoose} />
      <button type="button" onclick={goBack}>Go Back</button>
      {#if devMode}
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
</style>
