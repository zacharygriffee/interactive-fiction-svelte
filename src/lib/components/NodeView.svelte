<script>
  let { node, visibleStorylets = [] } = $props();
</script>

<section>
  <h2>{node.title ?? node.id}</h2>
  <div class="passage-body">{@html node.body ?? ""}</div>
  {#if visibleStorylets.length > 0}
    <hr />
    {#each visibleStorylets as storylet}
      <div class="storylet-body">{@html storylet.body ?? ""}</div>
    {/each}
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
