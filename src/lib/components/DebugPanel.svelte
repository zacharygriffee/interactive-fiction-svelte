<script>
  export let snapshot;
</script>

<section>
  <h3>Debug Snapshot</h3>
  <p>Intent events: {snapshot.intentLog?.length ?? 0}</p>
  <p>Ratified events: {snapshot.ratifiedLog?.length ?? 0}</p>
  <pre>{JSON.stringify(snapshot, null, 2)}</pre>
</section>

<style>
  pre {
    background: #121922;
    color: #d6e2f2;
    padding: 12px;
    border-radius: 6px;
    overflow: auto;
    font-size: 12px;
  }
</style>
