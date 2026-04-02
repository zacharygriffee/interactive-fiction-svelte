<script>
  let { choices = [], lockedChoices = [], showLockedChoices = false, onChoose = () => {} } = $props();
</script>

<section data-testid="choices-panel">
  <h3>Choices</h3>
  {#if choices.length === 0}
    <p>No available choices.</p>
  {:else}
    <ul class="choice-list" data-testid="choices-list">
      {#each choices as choice}
        <li>
          <button
            type="button"
            data-testid={`choice-${choice.id}`}
            class:move={choice.kind === "move"}
            class:system={choice.kind === "system"}
            onclick={() => onChoose(choice.id)}
          >
            <span>{choice.label}</span>
            <small>{choice.kind === "move" ? "Move" : choice.kind === "system" ? "System" : "Action"}</small>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if showLockedChoices && lockedChoices.length > 0}
    <div class="locked-panel" data-testid="locked-choices-panel">
      <h4>Locked Choices</h4>
      <ul class="choice-list locked-list">
        {#each lockedChoices as choice}
          <li>
            <button
              type="button"
              data-testid={`locked-choice-${choice.id}`}
              disabled
              class:move={choice.kind === "move"}
              class:system={choice.kind === "system"}
            >
              <span>{choice.label}</span>
              <small>{choice.kind === "move" ? "Move" : choice.kind === "system" ? "System" : "Action"}</small>
            </button>
            {#if choice.failed?.length}
              <ul class="reason-list">
                {#each choice.failed as item}
                  <li>{item.reason?.message}</li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</section>

<style>
  .choice-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }

  button {
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    border: 1px solid #cfc6b0;
    border-radius: 12px;
    background: #fcfbf6;
    padding: 10px 12px;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button.move {
    border-color: #9ab2c7;
    background: #f3f7fb;
  }

  button.system {
    border-color: #c4b19c;
    background: #f9f2ea;
  }

  small {
    color: #5d5d5d;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 11px;
    white-space: nowrap;
  }

  .locked-panel {
    margin-top: 12px;
    display: grid;
    gap: 8px;
  }

  .locked-panel h4,
  .reason-list {
    margin: 0;
  }

  .reason-list {
    padding-left: 18px;
    color: #6a5a42;
    display: grid;
    gap: 4px;
  }
</style>
