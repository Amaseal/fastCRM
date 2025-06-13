import { derived, writable } from 'svelte/store';

export const disableScroll = writable(false);

export const isEditorFocused = writable(false);
