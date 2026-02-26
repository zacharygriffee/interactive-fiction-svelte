<script>
  export let node;
  export let visibleStorylets = [];
</script>

<section>
  <h2>{node.title ?? node.id}</h2>
  <p>{node.body}</p>
  {#if visibleStorylets.length > 0}
    <hr />
    {#each visibleStorylets as storylet}
      <p>{storylet.body}</p>
    {/each}
  {/if}
  {#if node.tags?.length}
    <p><strong>Tags:</strong> {node.tags.join(", ")}</p>
  {/if}
</section>
