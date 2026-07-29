# Frontend Builder
FROM node:26-alpine AS frontend
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g --force corepack@latest && corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build && pnpm prune --prod

# Final Image
FROM node:26-alpine
LABEL name="Riven" \
    description="Riven Media Server: Frontend" \
    url="https://github.com/rivenmedia/riven-frontend"

# Set working directory
WORKDIR /riven

# Copy frontend build from the previous stage
COPY --from=frontend /app/build /riven/build
COPY --from=frontend /app/node_modules /riven/node_modules
COPY --from=frontend /app/package.json /riven/package.json
COPY --from=frontend /app/server.js /riven/server.js
COPY drizzle /riven/drizzle

# Ensure data directory exists for SQLite database
RUN mkdir -p /riven/data

# Add the entrypoint script
COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "/riven/server.js"]
