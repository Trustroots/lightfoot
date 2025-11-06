<script lang="ts">
  const { ...props } = $props<{
    class?: string;
  }>();
</script>

<!-- Custom Footer with GitHub and About links -->
<div
  {...props}
  class={[
    "flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs",
    props.class,
  ]}
>
  <span class="text-gray-600"
    >MapLibre | OpenFreeMap © OpenMapTiles Data from OpenStreetMap</span
  >
  <div class="flex items-center gap-2">
    <a
      href="https://github.com/Trustroots/lightfoot"
      target="_blank"
      rel="noopener noreferrer"
      class="text-blue-600 hover:text-blue-800 hover:underline"
    >
      GitHub
    </a>
    <span class="text-gray-400">|</span>
    <a
      href="https://wiki.trustroots.org/en/Lightfoot"
      target="_blank"
      rel="noopener noreferrer"
      class="text-blue-600 hover:text-blue-800 hover:underline"
    >
      About
    </a>
  </div>
</div>
