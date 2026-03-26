<script>
  import { onMount } from "svelte";

  const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"]);
  const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "ogg"]);
  const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "aac", "flac", "ogg"]);

  let loading = $state(true);
  let errorText = $state("");
  let files = $state([]);

  const images = $derived(files.filter((file) => IMAGE_EXTENSIONS.has(extensionOf(file))));
  const videos = $derived(files.filter((file) => VIDEO_EXTENSIONS.has(extensionOf(file)) && !IMAGE_EXTENSIONS.has(extensionOf(file))));
  const audio = $derived(files.filter((file) => AUDIO_EXTENSIONS.has(extensionOf(file)) && !VIDEO_EXTENSIONS.has(extensionOf(file))));
  const other = $derived(files.filter((file) => !images.includes(file) && !videos.includes(file) && !audio.includes(file)));

  function extensionOf(file) {
    const index = file.lastIndexOf(".");
    if (index === -1) {
      return "";
    }
    return file.slice(index + 1).toLowerCase();
  }

  function toAssetUrl(file) {
    return `/assets/${file}`;
  }

  onMount(async () => {
    try {
      const response = await fetch("/assets/manifest.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`manifest request failed (${response.status})`);
      }

      const payload = await response.json();
      const manifestFiles = Array.isArray(payload?.files) ? payload.files : [];
      files = manifestFiles
        .filter((item) => typeof item === "string" && item.length > 0)
        .slice()
        .sort((a, b) => a.localeCompare(b));
    } catch (error) {
      errorText = `Unable to load /assets/manifest.json: ${error.message}`;
    } finally {
      loading = false;
    }
  });
</script>

<section class="media-gallery">
  <h3>Media Gallery</h3>

  {#if loading}
    <p>Loading manifest...</p>
  {:else if errorText}
    <p class="error">{errorText}</p>
  {:else if files.length === 0}
    <p>No assets listed in manifest.</p>
  {:else}
    <p class="meta">{files.length} asset(s) discovered.</p>

    {#if images.length > 0}
      <h4>Images</h4>
      <div class="image-grid">
        {#each images as file}
          <a href={toAssetUrl(file)} target="_blank" rel="noreferrer noopener">
            <img src={toAssetUrl(file)} alt={file} loading="lazy" />
            <span>{file}</span>
          </a>
        {/each}
      </div>
    {/if}

    {#if videos.length > 0}
      <h4>Video</h4>
      <ul>
        {#each videos as file}
          <li><a href={toAssetUrl(file)} target="_blank" rel="noreferrer noopener">{file}</a></li>
        {/each}
      </ul>
    {/if}

    {#if audio.length > 0}
      <h4>Audio</h4>
      <ul>
        {#each audio as file}
          <li><a href={toAssetUrl(file)} target="_blank" rel="noreferrer noopener">{file}</a></li>
        {/each}
      </ul>
    {/if}

    {#if other.length > 0}
      <h4>Other</h4>
      <ul>
        {#each other as file}
          <li><a href={toAssetUrl(file)} target="_blank" rel="noreferrer noopener">{file}</a></li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style>
  .media-gallery {
    border: 1px solid #cfd8e2;
    border-radius: 8px;
    background: #f8fbff;
    padding: 12px;
    display: grid;
    gap: 8px;
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

  .meta {
    color: #405465;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  .image-grid a {
    display: grid;
    gap: 6px;
    text-decoration: none;
    color: inherit;
    background: #ffffff;
    border: 1px solid #d6dde6;
    border-radius: 6px;
    padding: 6px;
  }

  .image-grid img {
    width: 100%;
    height: 90px;
    object-fit: contain;
    background: #eef4fb;
    border-radius: 4px;
  }

  .image-grid span {
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .error {
    color: #9c1c1c;
    font-weight: 600;
  }
</style>
