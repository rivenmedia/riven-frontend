<div align="center">
  <a href="https://github.com/rivenmedia/riven">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/rivenmedia/riven/main/assets/iceberg-light.png">
      <img alt="riven" src="https://raw.githubusercontent.com/rivenmedia/riven/main/assets/iceberg-dark.png">
    </picture>
  </a>
</div>

<div align="center">
  <a href="https://github.com/rivenmedia/riven/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/rivenmedia/riven"></a>
    <a href="https://github.com/rivenmedia/riven-frontend/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/rivenmedia/riven-frontend"></a>
  <a href="https://github.com/rivenmedia/riven/issues"><img alt="Issues" src="https://img.shields.io/github/issues/rivenmedia/riven" /></a>
  <a href="https://github.com/rivenmedia/riven/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/rivenmedia/riven"></a>
  <a href="https://github.com/rivenmedia/riven/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/rivenmedia/riven" /></a>
  <a href="https://discord.gg/wDgVdH8vNM"><img alt="Discord" src="https://img.shields.io/badge/Join%20discord-8A2BE2" /></a>
</div>

<div align="center">
  <p>Plex torrent streaming through Real Debrid and 3rd party services like Overseerr, Mdblist, etc.</p>
</div>

## Riven Frontend

This repository contains the frontend for Riven. It is build with [SvelteKit](https://kit.svelte.dev/).

## Contributing

We welcome contributions from the community! To ensure a smooth collaboration, please follow these guidelines:

### Submitting Changes

- Open an Issue: For major changes, start by opening an issue to discuss your proposed modifications. This helps us understand your intentions and provide feedback early in the process.

- Pull Requests: Once your changes are ready, submit a pull request. Ensure your code adheres to our coding standards and passes all tests.

### Code Formatting

- **Frontend**: We use [Prettier](https://prettier.io/) for code formatting. Run prettier on your code before submitting.

- **Line Endings**: Use CRLF line endings unless the file is a shell script or another format that requires LF line endings.

### Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

> [!NOTE]  
> It is recommended to use latest LTS version of Node.js. If using `pnpm` you can run `pnpm env use --global lts` to switch to the latest LTS version.

```bash
npm run dev

npm run dev -- --open
```
