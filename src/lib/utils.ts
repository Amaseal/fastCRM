import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export function formatDate(dateString: number | Date | string) {
	const date = new Date(dateString);
	const options: Intl.DateTimeFormatOptions = {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: 'Europe/Riga'
	};
	const formattedDate = new Intl.DateTimeFormat('lv-LV', options).format(date);

	return formattedDate;
}

export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (...args: Parameters<T>): void {
		const later = () => {
			timeout = null;
			func(...args);
		};

		if (timeout !== null) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(later, wait);
	};
}

export function toCurrency(number: number) {
	const currency = (number / 100).toFixed(2);
	return currency;
}

export function getDateDifference(startDate: string | Date, endDate: string | Date): string {
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		throw new Error('Invalid date format');
	}

	const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

	if (totalDays < 30) {
		return `${totalDays} ${formatDays(totalDays)}`;
	}

	let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
	let days = end.getDate() - start.getDate();

	if (days < 0) {
		months -= 1;
		const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
		days += previousMonth.getDate();
	}

	return months > 0
		? `${months} ${formatMonths(months)}${days > 0 ? `, ${days} ${formatDays(days)}` : ''}`
		: `${days} ${formatDays(days)}`;
}

function formatDays(days: number): string {
	return days === 1 ? 'dienu' : 'dienas';
}

function formatMonths(months: number): string {
	return months === 1 ? 'mēnesi' : 'mēnešus';
}


export function isWorkFeasible(
	deadlineDate: string | number | Date, 
	workCount: number, 
	workPerDay: number = 50
): boolean {
	const deadline = new Date(deadlineDate);
	const today = new Date();

	// Normalize dates (set time to midnight for accurate comparison)
	const normalize = (date: Date): Date =>
		new Date(date.getFullYear(), date.getMonth(), date.getDate());

	const todayMidnight = normalize(today);
	const deadlineMidnight = normalize(deadline);

	// Calculate days remaining (including today)
	const daysRemaining = Math.floor(
		(deadlineMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
	) + 1;

	// If deadline is in the past, work is not feasible
	if (daysRemaining <= 0) {
		return true;
	}

	// Calculate maximum work possible within the remaining days
	const maxPossibleWork = daysRemaining * workPerDay;

	// Return true if the work required exceeds what's possible in the available time
	return workCount > maxPossibleWork;
}


/**
 * Get the number of days until a deadline (negative if overdue)
 */
export function getDaysUntilDeadline(deadlineDate: string | number | Date): number {
	const deadline = new Date(deadlineDate);
	const today = new Date();

	// Normalize dates (set time to midnight for accurate comparison)
	const normalize = (date: Date): Date =>
		new Date(date.getFullYear(), date.getMonth(), date.getDate());

	const todayMidnight = normalize(today);
	const deadlineMidnight = normalize(deadline);

	// Calculate days remaining (positive = future, negative = past, 0 = today)
	return Math.floor(
		(deadlineMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
	);
}

/**
 * Check if a deadline should show a warning icon (3 days or less)
 */
export function shouldShowDeadlineWarning(deadlineDate: string | number | Date): boolean {
	const daysUntil = getDaysUntilDeadline(deadlineDate);
	return daysUntil <= 3;
}

/**
 * Check if a deadline is urgent (today or overdue)
 */
export function isDeadlineUrgent(deadlineDate: string | number | Date): boolean {
	const daysUntil = getDaysUntilDeadline(deadlineDate);
	return daysUntil <= 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Normalizes Latvian text by removing diacritics and converting to lowercase
 * for search purposes. Maps Latvian special characters to their basic equivalents.
 */
export function normalizeLatvianText(text: string): string {
	if (!text) return '';
	
	return text
		.toLowerCase()
		.replace(/ā/g, 'a')
		.replace(/č/g, 'c')
		.replace(/ē/g, 'e')
		.replace(/ģ/g, 'g')
		.replace(/ī/g, 'i')
		.replace(/ķ/g, 'k')
		.replace(/ļ/g, 'l')
		.replace(/ņ/g, 'n')
		.replace(/š/g, 's')
		.replace(/ū/g, 'u')
		.replace(/ž/g, 'z')
		// Also handle uppercase versions
		.replace(/Ā/g, 'a')
		.replace(/Č/g, 'c')
		.replace(/Ē/g, 'e')
		.replace(/Ģ/g, 'g')
		.replace(/Ī/g, 'i')
		.replace(/Ķ/g, 'k')
		.replace(/Ļ/g, 'l')
		.replace(/Ņ/g, 'n')
		.replace(/Š/g, 's')
		.replace(/Ū/g, 'u')
		.replace(/Ž/g, 'z');
}
