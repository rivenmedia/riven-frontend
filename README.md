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
  <a href="https://discord.gg/wDgVdH8vNM"><img alt="Discord" src="https://img.shields.io/badge/Join%20discord-8A2BE2" /></a>
</div>

<div align="center">
  <p>Plex torrent streaming through Real Debrid and 3rd party services like Overseerr, Mdblist, etc.</p>
</div>

## Riven Frontend

This repository contains the frontend for Riven. It is build with [SvelteKit](https://kit.svelte.dev/).

---

## Running the frontend

To run the frontend, you need to have the backend running. You can find the backend [here](https://github.com/rivenmedia/riven)

### Using docker-compose (recommended)

Make sure you have docker and docker-compose installed on your system.

Edit the `docker-compose.yml` (make sure to replace the environment variables with your own) file to match your setup:

> [!IMPORTANT]  
> It is very important to set the `ORIGIN` and `BACKEND_URL` environment variables correctly to make the frontend work properly. Read more about them [here](#environment-variables).

```yml
services:
  riven-frontend:
    image: ghcr.io/rivenmedia/riven-frontend:latest
    container_name: riven-frontend
    restart: unless-stopped
    tty: true
    environment:
      - ORIGIN=http://localhost:3000 # No trailing slash, read more below
      - BACKEND_URL=http://127.0.0.1:8080 # No trailing slash, read more below
      - TZ=America/New_York
    ports:
      - '3000:3000'
```

Then run the following command:

```bash
docker-compose up -d
```

It will start the frontend container called `riven-frontend` on port `3000`.

### Using npm (or pnpm or yarn)

Make sure you have npm / pnpm / yarn installed on your system (pnpm is recommended).

Install the dependencies:

```bash
npm install # or pnpm install or yarn
```

Then run the following command:

```bash
npm run build # or pnpm run build or yarn build
```

It will build the frontend in the `build` directory.

Then run the following command:

```bash
ORIGIN=http://localhost:3000 BACKEND_URL=http://127.0.0.1:8080 node build
```

It will start the frontend on port `3000`.

### Environment variables

- `ORIGIN`: It's the URL you will use to access the frontend. If running behind a reverse proxy, you should set it to the URL of the reverse proxy, like `https://riven.example.com`. If running locally, you can let it be `http://localhost:3000` or you local server IP address like `http://192.168.1.45:3000`.

- `BACKEND_URL`: The URL of the backend. Default should work in most cases. You can also replace it with container name of backend if you are using docker-compose.

---

## NGINX Configuration _Optional_

### Install NGINX if not already

```
sudo apt update
sudo apt install nginx -y
```

### Start NGINX

```
sudo systemctl start nginx
sudo systemctl enable nginx
```

### _Optional_ Backup Default NGINX Configuration

```
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

### Create Riven Front End Conf

```
sudo nano /etc/nginx/sites-available/riven.conf
```

```
server {
    listen 80;
    server_name IP/DOMAIN; # Change to your Public IP Address or use a Domain with DNS A Record pointed to your Public IP address

    # Main location block to serve your application at /
    location / {
        # Create a user ` htpasswd -c /etc/nginx/.htpasswd USERNAMEHERE `
        auth_basic "Restricted Area";  # This is the realm name that will appear in the authentication dialog
        auth_basic_user_file /etc/nginx/.htpasswd;

        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        proxy_set_header Origin http://127.0.0.1:3000;

        # Prevent proxying loops
        proxy_redirect off;

        # Allow serving static assets correctly
        try_files $uri $uri/ @proxy;

        # Disable buffering for proxied responses
        proxy_buffering off;
    }

    # Fallback for anything that doesn't match
    location @proxy {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        proxy_set_header Origin http://127.0.0.1:3000;
    }
}
```

### Symlink to Sites Enabled

```
sudo ln -s /etc/nginx/sites-available/riven.conf /etc/nginx/sites-enabled/
```

### Test Configuration

```
sudo nginx -t
```

### Restart NGINX

```
sudo systemctl restart nginx
```

---

## Contributing

We welcome contributions from the community! To ensure a smooth collaboration, please follow these guidelines:

### Submitting Changes

- Open an Issue: For major changes, start by opening an issue to discuss your proposed modifications. This helps us understand your intentions and provide feedback early in the process.

- Pull Requests: Once your changes are ready, submit a pull request. Ensure your code adheres to our coding standards and passes all tests.

### Code Formatting

- **Frontend**: We use [Prettier](https://prettier.io/) for code formatting. Run prettier on your code before submitting.

- **Line Endings**: Use CRLF line endings unless the file is a shell script or another format that requires LF line endings.

### Developing

First install dependencies with `npm install` (or `pnpm install` or `yarn`). Then create `.env` with same content as `.env.example` and fill in the values. Then start the development server:

> [!NOTE]  
> It is recommended to use latest LTS version of Node.js. If using `pnpm` you can run `pnpm env use --global lts` to switch to the latest LTS version.

```bash
npm run dev

npm run dev -- --open
```

## Contributors

Thanks goes to these wonderful people:

<a href="https://github.com/rivenmedia/riven-frontend/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=rivenmedia/riven-frontend" />
</a>
