<script lang="ts">
	let {
		onClick,
		isOpen = false
	}: {
		onClick: () => void;
		isOpen?: boolean;
	} = $props();
</script>

<button
	class="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 {isOpen ? 'bg-blue-700' : ''}"
	onclick={onClick}
	aria-label="Add spot"
>
	<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
	</svg>
</button>