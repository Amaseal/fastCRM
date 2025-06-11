export function horizontalDragScroll(node: HTMLElement, disabled: boolean) {
	let isDragging = false;
	let startX: number;
	let scrollLeft: number;

	const handleMouseDown = (e: MouseEvent) => {
		if (disabled) return; // Check if disabled
		isDragging = true;
		startX = e.pageX - node.offsetLeft;
		scrollLeft = node.scrollLeft;
		node.style.cursor = 'grabbing';
		node.style.userSelect = 'none';
	};

	const handleMouseLeave = () => {
		if (disabled) return;
		if (isDragging) {
			isDragging = false;
			node.style.cursor = 'e-resize';
			node.style.userSelect = '';
		}
	};

	const handleMouseUp = () => {
		if (disabled) return;
		if (isDragging) {
			isDragging = false;
			node.style.cursor = 'e-resize';
			node.style.userSelect = '';
		}
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (disabled || !isDragging) return; // Check disabled in mousemove
		const x = e.pageX - node.offsetLeft;
		const walk = (x - startX) * 1;
		node.scrollLeft = scrollLeft - walk;
	};

	node.addEventListener('pointerdown', handleMouseDown);
	node.addEventListener('pointerleave', handleMouseLeave);
	node.addEventListener('pointerup', handleMouseUp);
	node.addEventListener('pointermove', handleMouseMove);

	return {
		update(newDisabled: boolean) {
			// Update function to react to prop changes
			disabled = newDisabled;
			if (disabled) {
				node.style.cursor = ''; // Reset cursor when disabled
				node.style.userSelect = '';
			} else {
				node.style.cursor = 'e-resize'; // Restore cursor when enabled
			}
		},
		destroy() {
			node.removeEventListener('pointerdown', handleMouseDown);
			node.removeEventListener('pointerleave', handleMouseLeave);
			node.removeEventListener('pointerup', handleMouseUp);
			node.removeEventListener('pointermove', handleMouseMove);
		}
	};
}
