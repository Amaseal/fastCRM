import { z } from 'zod';

export const productSchema = z.object({
	id: z.number().optional(),
	title: z
		.string()
		.min(1, { message: 'Nosaukumam jābūt vismaz 1 simbolu garam' })
		.max(100, { message: 'Nosaukumam jābūt ne vairāk kā 100 simboliem' }),

	description: z.string().optional(),
	cost: z.number()
});


export type ProductSchema = typeof productSchema;