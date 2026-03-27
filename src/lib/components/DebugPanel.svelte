<script>
  let { snapshot } = $props();
  let tab = $state("recent");

  const lockedChoices = $derived(snapshot?.choiceDiagnostics?.unavailable ?? []);
  const recentLines = $derived(snapshot?.recentChanges ?? []);
</script>

<section class="debug-panel">
  <div class="debug-header">
    <h3>Developer Console</h3>
    <div class="tabs">
      <button type="button" class:active={tab === "recent"} onclick={() => (tab = "recent")}>Recent</button>
      <button type="button" class:active={tab === "choices"} onclick={() => (tab = "choices")}>Choices</button>
      <button type="button" class:active={tab === "raw"} onclick={() => (tab = "raw")}>Raw</button>
    </div>
  </div>

  {#if tab === "recent"}
    <div class="panel-body">
      <p>Intent events: {snapshot.intentLog?.length ?? 0}</p>
      <p>Ratified events: {snapshot.ratifiedLog?.length ?? 0}</p>
      <p>Receipts: {snapshot.receiptLog?.length ?? 0}</p>
      {#if recentLines.length > 0}
        <ul>
          {#each recentLines as line}
            <li>{line}</li>
          {/each}
        </ul>
      {:else}
        <p>No recent change summary available.</p>
      {/if}
      {#if snapshot.logTail?.length}
        <div class="log-block">
          <h4>Runtime Log</h4>
          <ul>
            {#each snapshot.logTail as entry}
              <li>[{entry.level}] {entry.text}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {:else if tab === "choices"}
    <div class="panel-body">
      <h4>Available</h4>
      <ul>
        {#each snapshot.availableChoices ?? [] as choice}
          <li>{choice.label} ({choice.kind})</li>
        {/each}
      </ul>

      <h4>Locked</h4>
      {#if lockedChoices.length === 0}
        <p>No locked choices in this node.</p>
      {:else}
        <ul>
          {#each lockedChoices as choice}
            <li>
              <strong>{choice.label}</strong>
              {#if choice.failed?.length}
                <ul>
                  {#each choice.failed as item}
                    <li>{item.reason?.message}</li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else}
    <pre>{JSON.stringify(snapshot, null, 2)}</pre>
  {/if}
</section>

<style>
  .debug-panel {
    background: #121922;
    color: #d6e2f2;
    padding: 12px;
    border-radius: 8px;
    display: grid;
    gap: 12px;
  }

  .debug-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tabs button {
    border: 1px solid #38516e;
    border-radius: 999px;
    background: #1d2938;
    color: inherit;
    padding: 6px 10px;
  }

  .tabs button.active {
    background: #2d4a66;
  }

  .panel-body {
    display: grid;
    gap: 10px;
  }

  h3,
  h4,
  p,
  ul {
    margin: 0;
  }

  ul {
    padding-left: 18px;
  }

  .log-block {
    display: grid;
    gap: 6px;
  }

  pre {
    background: #0e141c;
    color: #d6e2f2;
    padding: 12px;
    border-radius: 6px;
    overflow: auto;
    font-size: 12px;
  }
</style>
