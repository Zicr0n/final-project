import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	boolean,
	index,
	integer,
	varchar,
	pgEnum
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
	username: text('username').notNull().default(''),
	displayUsername: text('display_username').notNull().default(''),
	isAnonymous: boolean('is_anonymous')
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_userId_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const character = pgTable('character', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
		.unique(),
	bodyColor: varchar('body_color', { length: 7 }).notNull().default('#ffffff'),
	hatId: integer('hat_id').default(0),
	shirtId: integer('shirt_id').default(0),
	eyesId: integer('eyes_id').default(0),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const galleryImage = pgTable('gallery_image', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	url: varchar('url', { length: 512 }).notNull(),
	caption: text('caption'),
	uploadedAt: timestamp('uploaded_at').defaultNow().notNull()
});

export const friendStatusEnum = pgEnum('friend_status', ['pending', 'accepted', 'rejected']);

export const friendRequest = pgTable('friend_request', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	senderId: text('sender_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	receiverId: text('receiver_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	status: friendStatusEnum('status').notNull().default('pending'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const roomTypeEnum = pgEnum('room_type', ['bomb', 'pop', 'scribble', 'vote']);

export const room = pgTable('room', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(),
	maxPlayers: integer('max_players').notNull().default(10),
	playerCount: integer('player_count').notNull().default(0),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	passwordHash: text('password_hash'),
	isPrivate: boolean('is_private').default(false),
	type: roomTypeEnum('type').notNull().default('bomb'),
	ownerId: text('owner_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	accounts: many(account),
	character: one(character, { fields: [user.id], references: [character.userId] }),
	galleryImages: many(galleryImage),
	sentRequests: many(friendRequest, { relationName: 'sender' }),
	receivedRequests: many(friendRequest, { relationName: 'receiver' }),
	ownedRooms: many(room)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] })
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] })
}));

export const characterRelations = relations(character, ({ one }) => ({
	user: one(user, { fields: [character.userId], references: [user.id] })
}));

export const galleryImageRelations = relations(galleryImage, ({ one }) => ({
	user: one(user, { fields: [galleryImage.userId], references: [user.id] })
}));

export const friendRequestRelations = relations(friendRequest, ({ one }) => ({
	sender: one(user, {
		fields: [friendRequest.senderId],
		references: [user.id],
		relationName: 'sender'
	}),
	receiver: one(user, {
		fields: [friendRequest.receiverId],
		references: [user.id],
		relationName: 'receiver'
	})
}));

export const roomRelations = relations(room, ({ one }) => ({
	owner: one(user, {
		fields: [room.ownerId],
		references: [user.id]
	})
}));
