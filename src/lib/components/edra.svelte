<script lang="ts">
	import type { Content, Editor } from '@tiptap/core';
	import {
		EdraEditor,
		EdraToolBar,
		EdraDragHandleExtended
	} from '$lib/components/edra/shadcn/index.js';

	let { value = $bindable(), name } = $props<{
		value?: string;
		name?: string;
	}>();

	// Editor states
	let content = $state<Content>();
	let editor = $state<Editor>();

	function onUpdate() {
		// Update the bindable value with HTML string
		value = editor?.getHTML() || '';
	}
	// Set initial content when value is provided and editor is ready
	$effect(() => {
		if (value && editor && !editor.isDestroyed) {
			// Check if the current content is different to avoid unnecessary updates
			const currentHTML = editor.getHTML();
			if (currentHTML !== value) {
				editor.commands.setContent(value);
			}
		}
	});

	// Set initial content state
	$effect(() => {
		if (value) {
			content = value;
		}
	});
</script>

<div class="bg-input/30 mb-4 h-[calc(100%-40px)] w-full max-w-5xl rounded-md border border-dashed">
	{#if editor && !editor.isDestroyed}
		<EdraToolBar
			class="bg-secondary/50 custom-scroll flex w-full items-center overflow-x-auto border-b border-dashed p-0.5"
			{editor}
		/>
		<EdraDragHandleExtended {editor} />
	{/if}
	<EdraEditor
		bind:editor
		{content}
		class="custom-scroll h-[calc(100%-40px)] overflow-y-scroll pr-2 pl-6"
		{onUpdate}
	/>

	<!-- Hidden input for form integration -->
	{#if name}
		<input type="hidden" {name} bind:value />
	{/if}
</div>
