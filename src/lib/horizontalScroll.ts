export function horizontalDragScroll(node: HTMLElement, disabled: boolean) {
	let isDragging = false;
	let startX: number;
	let scrollLeft: number;
	let ignoreEventsUntil = 0; // Timestamp to ignore events until
	
	const handleMouseDown = (e: MouseEvent) => {
		if (disabled) return;
		if (Date.now() < ignoreEventsUntil) {
			e.stopPropagation();
			e.preventDefault();
			return;
		}
		
		// Check if the click target or any parent has drag-related attributes or classes
		let target = e.target as HTMLElement;
		while (target && target !== node) {
			// Check for drag-related attributes or classes
			if (target.hasAttribute('data-dnd-kit-sortable-id') || 
				target.hasAttribute('data-dnd-kit-droppable-id') ||
				target.classList.contains('cursor-grab') ||
				target.classList.contains('cursor-grabbing') ||
				target.closest('[data-dnd-kit-sortable-id]') ||
				target.closest('[data-dnd-kit-droppable-id]')) {
				// This is a drag handle or drag area, don't activate horizontal scroll
				return;
			}
			target = target.parentElement as HTMLElement;
		}
		
		e.stopPropagation(); // Prevent event bubbling
		isDragging = true;
		startX = e.pageX - node.offsetLeft;
		scrollLeft = node.scrollLeft;
		node.style.cursor = 'grabbing';
		node.style.userSelect = 'none';
	};
	const handleMouseLeave = () => {
		if (disabled || Date.now() < ignoreEventsUntil) return;
		if (isDragging) {
			isDragging = false;
			node.style.cursor = 'e-resize';
			node.style.userSelect = '';
		}
	};

	const handleMouseUp = (e: MouseEvent) => {
		if (disabled || Date.now() < ignoreEventsUntil) return;
		e.stopPropagation(); // Prevent event bubbling
		if (isDragging) {
			isDragging = false;
			node.style.cursor = 'e-resize';
			node.style.userSelect = '';
		}
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (disabled || !isDragging || Date.now() < ignoreEventsUntil) return;
		e.stopPropagation(); // Prevent event bubbling
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
			disabled = newDisabled;			if (disabled) {
				node.style.cursor = ''; // Reset cursor when disabled
				node.style.userSelect = '';			} else {
				// When re-enabling, set a longer grace period to ignore immediate events
				ignoreEventsUntil = Date.now() + 500; // 500ms grace period
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
