import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql, type InferSelectModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof user>;
export type Client = InferSelectModel<typeof client>;
export type Product = InferSelectModel<typeof product>;
export type Session = InferSelectModel<typeof session>;
export type Material = InferSelectModel<typeof material>;
export type Task = InferSelectModel<typeof task>;
export type Tab = InferSelectModel<typeof tab>;
export type TaskMaterial = InferSelectModel<typeof taskMaterial>;
export type TaskProduct = InferSelectModel<typeof taskProduct>;
export type File = InferSelectModel<typeof file>; // Add file type

const timestamps = {
	updated_at: t.int({ mode: 'timestamp' }).$onUpdate(() => new Date()),
	created_at: t.int({ mode: 'timestamp' }).notNull().default(new Date())
};

export const user = table('users', {
	id: t.text('id').primaryKey(),
	email: t.text('email').notNull(),
	password: t.text('password').notNull(),
	name: t.text('name'),
	nextcloud: t.text('nextcloud'),
	...timestamps
});

export const session = table('session', {
	id: t.text('id').primaryKey(),
	userId: t
		.text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: t
		.integer('expires_at', {
			mode: 'timestamp'
		})
		.notNull()
});

export const client = table('clients', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	name: t.text('name').notNull(),
	email: t.text('email'),
	phone: t.text('phone'),
	description: t.text('description'),
	address: t.text('address'), // Added address field to match the desired output
	type: t.text('type').$type<'BTC' | 'BTB'>().default('BTC').notNull(),
	totalOrdered: t.int('total_ordered'),
	...timestamps
});

// Materials
export const material = table('materials', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	title: t.text('title').notNull(),
	article: t.text('article').notNull(),
	image: t.text('image'),
	manufacturer: t.text('manufacturer'),
	gsm: t.int('gsm'),
	width: t.int('width'),
	remaining: t.int('remaining').notNull().default(0),
	...timestamps
});

export const product = table('products', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	title: t.text('title').notNull(),
	description: t.text('description'),
	cost: t.int('cost').notNull(),
	...timestamps
});

export const tab = table('tabs', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	title: t.text('title').notNull(),
	color: t.text('color').notNull(),
	order: t.int('order').default(0).notNull(),
	isProtected: t.integer('is_protected', { mode: 'boolean' }).default(false).notNull(), // Prevent deletion if true
	...timestamps
});


export const notification = table('notifications', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	text: t.text('text').notNull(),
	...timestamps
});

// Files - Simple file storage for tasks
export const file = table('files', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	filename: t.text('filename').notNull(), // Filename as uploaded by user
	downloadUrl: t.text('download_url').notNull(), // URL to access/download the file
	size: t.int('size').notNull(), // File size in bytes for display purposes
	taskId: t.int('task_id').references(() => task.id), // Direct reference to the task, now nullable for initial upload
	...timestamps
});

// TaskMaterials (junction table for task-material many-to-many)
export const taskMaterial = table('taskMaterials', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	taskId: t.int('task_id').notNull().references(() => task.id),
	materialId: t.int('material_id').notNull().references(() => material.id),
	...timestamps
});

// TaskProducts
export const taskProduct = table('taskProducts', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	taskId: t.int('task_id').notNull().references(() => task.id),
	productId: t.int('product_id').notNull().references(() => product.id),
	count: t.int('count').default(1),
	...timestamps
});

// Tasks
export const task = table('tasks', {
	id: t.int('id').primaryKey({ autoIncrement: true }),
	title: t.text('title').notNull(),
	description: t.text('description'), // Can contain JSON for rich text if needed
	tabId: t.int('tab').references(() => tab.id),
	clientId: t.int('client').references(() => client.id),
	managerId: t.text('manager').references(() => user.id),
	responsiblePersonId: t.text('responsible_person').references(() => user.id),
	count: t.int('count'),
	endDate: t.text('end_date'),
	isPrinted: t.integer('is_printed', { mode: 'boolean' }), // boolean as integer
	price: t.int('price'),
	preview: t.text('preview'),
	...timestamps
});

// Relations for Task
export const taskRelations = relations(task, ({ one, many }) => ({
	client: one(client, {
		fields: [task.clientId],
		references: [client.id]
	}),
	manager: one(user, {
		fields: [task.managerId],
		references: [user.id],
		relationName: 'managedTasks'
	}),
	responsiblePerson: one(user, {
		fields: [task.responsiblePersonId],
		references: [user.id],
		relationName: 'responsibleTasks'
	}),
	materials: many(taskMaterial),
	taskProducts: many(taskProduct),
	files: many(file, { relationName: 'taskFiles' }), // Add files relation
	tab: one(tab, {
		fields: [task.tabId],
		references: [tab.id]
	})
}));

// Relations for TaskMaterial
export const taskMaterialRelations = relations(taskMaterial, ({ one }) => ({
	task: one(task, {
		fields: [taskMaterial.taskId],
		references: [task.id]
	}),
	material: one(material, {
		fields: [taskMaterial.materialId],
		references: [material.id]
	})
}));

// Relations for TaskProduct
export const taskProductRelations = relations(taskProduct, ({ one }) => ({
	task: one(task, {
		fields: [taskProduct.taskId],
		references: [task.id]
	}),
	product: one(product, {
		fields: [taskProduct.productId],
		references: [product.id]
	})
}));

export const userRelations = relations(user, ({ many }) => ({
	managedTasks: many(task, { relationName: 'managedTasks' }),
	responsibleTasks: many(task, { relationName: 'responsibleTasks' })
}));

// Relations for Tab
export const tabRelations = relations(tab, ({ many, one }) => ({
	tasks: many(task),
}));

export const materialRelations = relations(material, ({ many }) => ({
	taskMaterials: many(taskMaterial)
}));

export const productRelations = relations(product, ({ many }) => ({
	taskProducts: many(taskProduct)
}));

export const clientRelations = relations(client, ({ many }) => ({
	tasks: many(task)
}));

// File relations
export const fileRelations = relations(file, ({ one }) => ({
	task: one(task, {
		fields: [file.taskId],
		references: [task.id],
		relationName: 'taskFiles'
	}),
}));

