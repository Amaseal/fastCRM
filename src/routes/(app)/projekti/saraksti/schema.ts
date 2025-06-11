import { z } from 'zod';

export const tabSchema = z.object({
	id: z.number().optional(),
	title: z
		.string()
		.min(1, { message: 'Nosaukumam jābūt vismaz 1 simbolu garam' })
		.max(100, { message: 'Nosaukumam jābūt ne vairāk kā 100 simboliem' }),
	color: z.string().default('#ffffff'),
});

export type TabSchema = typeof tabSchema;