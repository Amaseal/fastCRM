// scripts/seed.ts
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/lib/server/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const client = new Database(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function seed() {
	console.log('🌱 Checking for "done" tab...');

	try {
		const existingDoneTab = await db
			.select()
			.from(schema.tab)
			.where(and(eq(schema.tab.title, 'done'), eq(schema.tab.isProtected, true)))
			.limit(1);

		if (existingDoneTab.length === 0) {
			const maxOrderResult = await db
				.select({ maxOrder: schema.tab.order })
				.from(schema.tab)
				.orderBy(desc(schema.tab.order))
				.limit(1);

			const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

			await db.insert(schema.tab).values({
				title: 'done',
				color: '#22c55e',
				order: nextOrder,
				isProtected: true
			});

			console.log('✅ Created "done" tab');
		} else {
			console.log('✅ "done" tab already exists');
		}

		console.log('🌱 Checking for initial invite code...');

		const existingInviteCode = await db
			.select()
			.from(schema.inviteCodes)
			.where(eq(schema.inviteCodes.code, 'WELCOME2025'))
			.limit(1);
		if (existingInviteCode.length === 0) {
			// Create initial invite code that expires in 24 hours
			const expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours() + 24);
			await db.insert(schema.inviteCodes).values({
				code: 'WELCOME2025',
				expiresAt: expiresAt.toISOString(),
				used: false
			});

			console.log('✅ Created initial invite code: WELCOME2025');
		} else {
			console.log('✅ Initial invite code already exists');
		}

		console.log('🌱 Seeding completed');
	} catch (error) {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	} finally {
		client.close();
	}
}

seed();
