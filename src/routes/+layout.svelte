<script lang="ts">
	import '../app.css';
	import SEO from '$lib/components/SEO.svelte';

	let { children } = $props();
</script>

<SEO />

{@render children?.()}
