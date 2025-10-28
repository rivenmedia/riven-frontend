<div align="center">
  <a href="https://github.com/rivenmedia/riven">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/rivenmedia/riven/main/assets/riven-light.png">
      <img alt="riven" src="https://raw.githubusercontent.com/rivenmedia/riven/main/assets/riven-dark.png">
    </picture>
  </a>
</div>

<div align="center">
  <a href="https://github.com/rivenmedia/riven/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/rivenmedia/riven?label=Riven+Backend"></a>
    <a href="https://github.com/rivenmedia/riven-frontend/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/rivenmedia/riven-frontend?label=Riven+Frontend"></a>
  <a href="https://github.com/rivenmedia/riven/issues"><img alt="Issues" src="https://img.shields.io/github/issues/rivenmedia/riven-frontend" /></a>
  <a href="https://github.com/rivenmedia/riven/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/rivenmedia/riven-frontend"></a>
  <a href="https://github.com/rivenmedia/riven/graphs/contributors-frontend"><img alt="Contributors" src="https://img.shields.io/github/contributors/rivenmedia/riven-frontend" /></a>
  <a href="https://discord.riven.tv"><img alt="Discord" src="https://img.shields.io/badge/Join%20discord-8A2BE2" /></a>
</div>

## Riven Frontend

This repository contains the frontend for Riven. It is build with [SvelteKit](https://kit.svelte.dev/).

---

## Table Of Contents

- [Running the frontend](#running-the-frontend)
    - [Using docker-compose (recommended)](#using-docker-compose-recommended)
    - [Manual installation](#manual-installation)
    - [Environment variables](#environment-variables)
- [Developing](#developing)
    - [Generating API schema & types](#generating-api-schema--types)
    - [Database schemas and migrations & Authentication](#database-schemas-and-migrations--authentication)
- [Contributing](#contributing)
    - [Submitting Changes](#submitting-changes)
    - [Code Formatting](#code-formatting)
- [Contributors](#contributors)
- [Star History](#star-history)

## Running the frontend

To run the frontend, you need to have the backend running. You can find the backend [here](https://github.com/rivenmedia/riven)

### Using docker-compose (recommended)

Make sure you have docker and docker-compose installed on your system.

Edit the [`docker-compose.yml`](./docker-compose.yml) (make sure to replace the environment variables with your own) file to match your setup:

Then run the following command:

```bash
docker-compose up -d
```

It will start the frontend container called `riven-frontend` on port `3000`.

### Manual installation

Make sure you have pnpm installed on your system.

Install the dependencies:

```bash
pnpm install
```

Then run the following command:

```bash
pnpm run build
```

It will build the frontend in the `build` directory.

Then run the following command:

```bash
ORIGIN=http://localhost:3000 node build
```

It will start the frontend on port `3000`.

### Environment variables

Refer to the [`.env.example`](./.env.example) file for the list of environment variables required to run the frontend.

---

### Developing

First install dependencies with `pnpm install`. Then create `.env` with same content as `.env.example` and fill in the values. Then start the development server:

> [!NOTE]  
> It is recommended to use latest LTS version of Node.js. If using `pnpm` you can run `pnpm env use --global lts` to switch to the latest LTS version.

```bash
pnpm run dev
```

#### Generating API schema & types

To update Backend API schema & types, run:

```bash
pnpm run generate-api
```

To update TMDB/TVDB provider types, run the commands in [`/src/lib/providers/index.ts`](./src/lib/providers/index.ts).

To update Trakt provider types, run the commands in [`/scripts/trakt-b2s.ts`](./scripts/trakt-b2s.ts). Optionally if remote trakt spec is updated, replace [`/scripts/trakt.apib`](./scripts/trakt.apib) with the latest from [Trakt API description document](https://trakt.docs.apiary.io/api-description-document)

#### Database schemas and migrations & Authentication

We use [Better-Auth](https://better-auth.dev/) for authentication and user management, and [Drizzle ORM](https://drizzle.team/) for database management. Better-Auth is also configured to use Drizzle ORM as its database layer.

The database schemas are defined in [`src/lib/server/schema`](./src/lib/server/schema) and migrations are in [`/drizzle`](./drizzle).

Drizzle config is in [`drizzle.config.ts`](./drizzle.config.ts) and db connection is in [`src/lib/server/db`](./src/lib/server/db.ts).

Better-Auth config is duplicated at [`better-auth.config.ts`](./better-auth.config.ts) for CLI usage and [`src/lib/server/auth.ts`](./src/lib/server/auth.ts) for runtime usage. This is due to the limitation of Better-Auth CLI not being able to read SvelteKit's environment variables.

This codebase uses the "Runtime Migrations" approach ([option 4](https://orm.drizzle.team/docs/migrations)) of Drizzle ORM, which means migrations are run automatically on server start (ran in init function of [`src/hooks.server.ts`](./src/hooks.server.ts)).

Now, schema for auth is generated by Better-Auth CLI and output to [`src/lib/server/schema/ba-auth.ts`](./src/lib/server/schema/ba-auth.ts). To update the schema file after changing Better-Auth config, run:

```bash
pnpm run ba:generate
```

Then to create a new migration file based on the updated schema, run:

```bash
pnpm run db:generate
```

Now, to apply the migration to the database, simply restart the server and it will run the migration automatically.

If you edit schema files or add new schema files (not auth related), you can run the following command to generate a new migration file based on schema changes:

```bash
pnpm run db:generate
```

Again, to apply the migration to the database, simply restart the server.

It's not recommended to use `pnpm run db:pull`, since it outputs migration along with single schema & relation file, which are moved to `src/lib/server/schema` managed by the [`/scripts/drizzle_pull.sh`](./scripts/drizzle_pull.sh) script. This overwrites the schema & relation files (not the better-auth schema file) every time it's run.

---

## Contributing

We welcome contributions from the community! To ensure a smooth collaboration, please follow these guidelines:

### Submitting Changes

- Open an Issue: For major changes, start by opening an issue to discuss your proposed modifications. This helps us understand your intentions and provide feedback early in the process.

- Pull Requests: Once your changes are ready, submit a pull request. Ensure your code adheres to our coding standards and passes all tests.

### Code Formatting

- **Frontend**: We use [Prettier](https://prettier.io/) for code formatting. Run prettier on your code before submitting. You can use the following command:

```bash
pnpm run format
```

- **Line Endings**: Use CRLF line endings unless the file is a shell script or another format that requires LF line endings.

---

## Contributors

Thanks goes to these wonderful people

<a href="https://github.com/rivenmedia/riven-frontend/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rivenmedia/riven-frontend" />
</a>

---

## Star History

<a href="https://www.star-history.com/#rivenmedia/riven&rivenmedia/riven-frontend&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=rivenmedia/riven,rivenmedia/riven-frontend&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=rivenmedia/riven,rivenmedia/riven-frontend&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=rivenmedia/riven,rivenmedia/riven-frontend&type=date&legend=top-left" />
 </picture>
</a>
