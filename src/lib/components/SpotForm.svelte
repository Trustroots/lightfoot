<script lang="ts">
	let {
		spotData = $bindable({
			name: '',
			description: '',
			latitude: 0,
			longitude: 0,
			tags: [] as string[]
		})
	}: {
		spotData: {
			name: string;
			description: string;
			latitude: number;
			longitude: number;
			tags: string[];
		};
	} = $props();

	let tagInput = $state('');
	let errors = $state({
		name: '',
		description: '',
		tags: ''
	});

	function validateField(field: keyof typeof errors) {
		switch (field) {
			case 'name':
				if (!spotData.name.trim()) {
					errors.name = 'Spot name is required';
				} else if (spotData.name.length > 100) {
					errors.name = 'Spot name must be less than 100 characters';
				} else {
					errors.name = '';
				}
				break;
			case 'description':
				if (spotData.description.length > 500) {
					errors.description = 'Description must be less than 500 characters';
				} else {
					errors.description = '';
				}
				break;
			case 'tags':
				if (spotData.tags.length > 10) {
					errors.tags = 'Maximum 10 tags allowed';
				} else {
					errors.tags = '';
				}
				break;
		}
	}

	function addTag() {
		const tag = tagInput.trim().toLowerCase();
		if (tag && !spotData.tags.includes(tag) && spotData.tags.length < 10) {
			spotData.tags = [...spotData.tags, tag];
			tagInput = '';
			validateField('tags');
		}
	}

	function removeTag(tagToRemove: string) {
		spotData.tags = spotData.tags.filter(tag => tag !== tagToRemove);
		validateField('tags');
	}

	function handleTagInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		}
	}

	$effect(() => {
		validateField('name');
	});
	$effect(() => {
		validateField('description');
	});
</script>

<div class="space-y-4">
	<div>
		<label for="spot-name" class="block text-sm font-medium text-gray-700 mb-1">
			Spot Name <span class="text-red-500">*</span>
		</label>
		<input
			id="spot-name"
			type="text"
			class="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
			placeholder="Enter spot name"
			bind:value={spotData.name}
			required
		/>
		{#if errors.name}
			<p class="mt-1 text-sm text-red-600">{errors.name}</p>
		{/if}
	</div>

	<div>
		<label for="spot-description" class="block text-sm font-medium text-gray-700 mb-1">
			Description
		</label>
		<textarea
			id="spot-description"
			class="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none resize-vertical"
			placeholder="Describe this spot..."
			rows="3"
			bind:value={spotData.description}
		></textarea>
		{#if errors.description}
			<p class="mt-1 text-sm text-red-600">{errors.description}</p>
		{/if}
		<p class="mt-1 text-xs text-gray-500">{spotData.description.length}/500 characters</p>
	</div>

	<div>
		<label for="spot-tags" class="block text-sm font-medium text-gray-700 mb-1">
			Tags
		</label>
		<div class="flex gap-2">
			<input
				id="spot-tags"
				type="text"
				class="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
				placeholder="Add a tag..."
				bind:value={tagInput}
				onkeydown={handleTagInputKeydown}
			/>
			<button
				type="button"
				class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
				onclick={addTag}
				disabled={!tagInput.trim() || spotData.tags.includes(tagInput.trim().toLowerCase())}
			>
				Add
			</button>
		</div>
		{#if spotData.tags.length > 0}
			<div class="mt-2 flex flex-wrap gap-2">
				{#each spotData.tags as tag}
					<span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
						{tag}
						<button
							type="button"
							class="ml-1 text-blue-600 hover:text-blue-800"
							onclick={() => removeTag(tag)}
							aria-label="Remove tag"
						>
							×
						</button>
					</span>
				{/each}
			</div>
		{/if}
		{#if errors.tags}
			<p class="mt-1 text-sm text-red-600">{errors.tags}</p>
		{/if}
		<p class="mt-1 text-xs text-gray-500">{spotData.tags.length}/10 tags</p>
	</div>
</div>