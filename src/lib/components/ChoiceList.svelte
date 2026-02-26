<script>
  export let choices = [];
  export let onChoose = () => {};
</script>

<section>
  <h3>Choices</h3>
  {#if choices.length === 0}
    <p>No available choices.</p>
  {:else}
    <ul>
      {#each choices as choice}
        <li>
          <button type="button" on:click={() => onChoose(choice.id)}>{choice.label}</button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
