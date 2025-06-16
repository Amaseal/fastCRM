import { z } from 'zod';

export const userSchema = z.object({
	password: z
		.string({
			required_error: 'Parole ir obligāta',
			invalid_type_error: 'Paroles veids ir nepareizs'
		})
		.min(8, { message: 'Parolei jābūt vismaz 8 simbolu garai' })
		.max(20),
	email: z
		.string({
			required_error: 'Epasts ir obligāts',
			invalid_type_error: 'Nepieciešama derīga epasta adrese'
		})
		.email({ message: 'Nederīga e-pasta adrese' }),
	name: z.string({required_error: 'Vārds ir obligāts un tiks attelots kā lietotājvārds'}).min(1, { message: 'Vārdam jābūt garākam kā 1 burts' }).optional(),
})

export type UserSchema = typeof userSchema;