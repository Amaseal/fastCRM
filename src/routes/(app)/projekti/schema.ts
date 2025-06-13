import { z } from 'zod';

export type TaskSchema = typeof taskSchema;
export type TaskProductSchema = typeof taskProductSchema;

export const taskProductSchema = z.object({
	id: z.number().optional(),		productId: z.coerce.number().min(1, { message: 'Produkta ID ir obligāts' }), // Auto-convert string to number
	count: z.number().int().positive({ message: 'Skaits nevar būt mazāks par 1' }).default(1)
});

export const taskSchema = z
	.object({
		id: z.number().optional(),
		title: z
			.string()
			.min(1, { message: 'Nosaukumam jābūt vismaz 1 simbolu garam' })
			.max(100, { message: 'Nosaukumam jābūt ne vairāk kā 100 simboliem' }),
		description: z.string().optional(), // JSON object from TipTap editor
		tabId: z.number().optional(),
		clientId: z.number().optional(),
		// Separate fields for new client information instead of nested object
		newClientName: z.string().optional(),
		newClientEmail: z.string().email().optional(),
		newClientPhone: z.string().optional(),
		newClientDescription: z.string().optional(),
		newClientType: z.enum(['BTB', 'BTC']).optional().default('BTB'),
		managerId: z.string().optional(),
		responsiblePersonId: z.string().optional(),
		count: z.number().min(1, { message: 'Skaitam jābūt vismaz 1' }).default(1),
		endDate: z.string().optional(),
		isPrinted: z.boolean().optional().default(false),
		files: z.array(z.number()).optional().default([]),		price: z.number(),
		seamstress: z.string().optional(),
		materialIds: z.array(z.coerce.number()).optional().default([]), // Auto-convert strings to numbers
		preview: z.string().optional(),
		// Support multiple products
		taskProducts: z.array(taskProductSchema).optional().default([])
	})
	.superRefine((data, ctx) => {
		// Validation for new client fields - if name is provided, then either email or phone is required
		if (data.newClientName && !data.newClientEmail && !data.newClientPhone) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Jaunam klientam nepieciešama vai nu e-pasta adrese vai tālruņa numurs',
				path: ['newClientEmail']
			});
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Jaunam klientam nepieciešama vai nu e-pasta adrese vai tālruņa numurs',
				path: ['newClientPhone']
			});
		}
	});
