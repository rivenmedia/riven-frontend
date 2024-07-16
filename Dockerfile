# Frontend Builder
FROM node:20-alpine AS frontend
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install
RUN pnpm run build && pnpm prune --prod

# Final Image
FROM node:20-alpine
LABEL name="Riven" \
    description="Riven Media Server: Frontend" \
    url="https://github.com/rivenmedia/riven-frontend"

# Set working directory
WORKDIR /riven

# Copy frontend build from the previous stage
COPY --from=frontend  /app/build /riven/build
COPY --from=frontend  /app/node_modules /riven/node_modules
COPY --from=frontend  /app/package.json /riven/package.json

COPY version.txt /riven/

ENTRYPOINT ["ORIGIN=$ORIGIN", "BACKEND_URL=$BACKEND_URL", "node", "/riven/build"]