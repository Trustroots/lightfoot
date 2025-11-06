<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	export let title: string = 'Lightfoot';
	export let description: string =
		'Discover, share, and explore the world of hitchhiking with Lightfoot. Find routes, tips, and stories from the global hitchhiking community.';
	export let keywords: string = 'hitchhiking, lightfoot, travel, routes, tips, community, maps';
	export let author: string = '';
	export let image: string = '';
	export let url: string = '';
</script>

<svelte:head>
	{#if title}
		<title>{title}</title>
		<meta property="og:title" content={title} />
		<meta name="twitter:title" content={title} />
	{/if}
	{#if description}
		<meta name="description" content={description} />
		<meta property="og:description" content={description} />
		<meta name="twitter:description" content={description} />
	{/if}
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	{#if author}
		<meta name="author" content={author} />
	{/if}
	{#if image}
		<meta property="og:image" content={image} />
		<meta name="twitter:image" content={image} />
	{/if}
	{#if url}
		<meta property="og:url" content={url} />
	{/if}
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="icon" href={favicon} />
</svelte:head>
