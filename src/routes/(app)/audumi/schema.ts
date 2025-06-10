import { z } from 'zod';

export const materialSchema = z.object({
	id: z.number().optional(),
	title: z
		.string()
		.min(1, { message: 'Nosaukumam jābūt vismaz 1 simbolu garam' })
		.max(100, { message: 'Nosaukumam jābūt ne vairāk kā 100 simboliem' }),
	manufacturer: z.string(),
	article: z.string(),
	image: z.string().optional().default(''),
	gsm: z.number(),
	width: z.number(),
	remaining: z.number()
});

export type MaterialSchema = typeof materialSchema;
