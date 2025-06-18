# FastCRM

A modern CRM application built with SvelteKit, featuring project management, client tracking, and Nextcloud Talk integration.

## Features

- 📋 Project and task management
- 👥 Client management
- 🗣️ Nextcloud Talk integration for project sharing
- 📁 File uploads and management
- 🎮 Gamification with daily word game
- 🔐 User authentication and invite system
- 📊 Dashboard and analytics

## Deployment with Coolify

### Prerequisites

- Coolify instance
- GitHub repository
- Nextcloud instance (optional, for Talk integration)

### Setup

1. **Environment Variables** (set in Coolify):

   ```bash
   NEXTCLOUD_URL=https://your-nextcloud-instance.com
   DATABASE_URL=file:./local.db
   NODE_ENV=production
   PORT=3000
   ```

2. **GitHub Integration**:

   - Connect your GitHub repository to Coolify
   - Coolify will automatically build and deploy using the included Dockerfile
   - The docker-compose.yml handles persistent volumes for uploads and database

3. **First Run**:
   - The app will create the SQLite database automatically
   - Access the app and register the first user with an invite code
   - Configure Nextcloud credentials in user settings

### Volumes

The deployment uses persistent volumes for:

- `uploads_data`: User uploaded files (`/app/static/uploads`)
- `db_data`: SQLite database and app data (`/app`)

## Local Development

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
