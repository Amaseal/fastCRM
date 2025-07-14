import { z } from 'zod';

export const clientSchema = z.object({
	id: z.number().optional(),
	name: z
		.string()
		.min(1, { message: 'Nosaukumam jābūt vismaz 1 simbolu garam' })
		.max(100, { message: 'Nosaukumam jābūt ne vairāk kā 100 simboliem' }),
	email: z.string().optional(),
	phone: z.string().optional(),
	description: z.string().optional(),
	type: z.enum(['BTB', 'BTC']).optional().default('BTB')
}).superRefine((data, ctx) => {
	// Convert empty strings to undefined for validation
	const phone = data.phone?.trim() || undefined;
	const email = data.email?.trim() || undefined;
	
	if (!phone && !email) {
		// Add issue to both email and phone fields
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'Nepieciešama vai nu e-pasta adrese vai tālruņa numurs',
			path: ['email']
		});
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'Nepieciešama vai nu e-pasta adrese vai tālruņa numurs',
			path: ['phone']
		});
	}
	
	// Validate email format if provided
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'Nederīga e-pasta adrese',
			path: ['email']
		});
	}
});

export type ClientSchema = typeof clientSchema;