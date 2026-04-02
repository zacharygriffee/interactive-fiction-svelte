<script>
  let { node, visibleStorylets = [] } = $props();
</script>

<section data-testid="node-view">
  <h2 data-testid="node-title">{node.title ?? node.id}</h2>
  <div class="passage-body" data-testid="node-body">{@html node.body ?? ""}</div>
  {#if visibleStorylets.length > 0}
    <div data-testid="node-storylets">
      <hr />
      {#each visibleStorylets as storylet}
        <div class="storylet-body">{@html storylet.body ?? ""}</div>
      {/each}
    </div>
  {/if}
  {#if node.tags?.length}
    <p><strong>Tags:</strong> {node.tags.join(", ")}</p>
  {/if}
</section>

<style>
  .passage-body,
  .storylet-body {
    line-height: 1.45;
  }

  :global(.passage-body img),
  :global(.storylet-body img),
  :global(.passage-body video),
  :global(.storylet-body video) {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }
</style>
