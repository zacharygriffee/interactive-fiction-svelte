<script>
  import { onMount } from "svelte";
  import NodeView from "./lib/components/NodeView.svelte";
  import ChoiceList from "./lib/components/ChoiceList.svelte";
  import DebugPanel from "./lib/components/DebugPanel.svelte";
  import { ACTION_TYPES } from "./lib/story/types.js";

  export let pear;
  export let driver;

  let snapshot = null;
  let errorText = "";

  onMount(() => {
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

<div id="bar"><pear-ctrl></pear-ctrl></div>
<main>
  <h1>Interactive Fiction Runtime</h1>
  {#if pear}
    <p>Pear runtime: {pear.version}</p>
  {/if}

  {#if errorText}
    <p class="error">{errorText}</p>
  {/if}

  {#if snapshot}
    <NodeView node={snapshot.node} visibleStorylets={snapshot.visibleStorylets} />
    <ChoiceList choices={snapshot.availableChoices} onChoose={onChoose} />
    <button type="button" on:click={goBack}>Go Back</button>
    <DebugPanel snapshot={snapshot} />
  {:else}
    <p>Loading...</p>
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
    max-width: 740px;
    margin: 24px auto;
    padding: 0 16px 32px;
    display: grid;
    gap: 12px;
  }

  .error {
    color: #9c1c1c;
    font-weight: 600;
  }
</style>
