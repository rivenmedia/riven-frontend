.PHONY: help install run start stop restart logs shell build push push-dev push-branch push-custom-branch clean format check lint tidy update diff test setup-builder

BRANCH_NAME := $(shell git rev-parse --abbrev-ref HEAD | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]')
COMMIT_HASH := $(shell git rev-parse --short HEAD)

help:
	@echo "Riven Frontend Local Development Environment"
	@echo "-------------------------------------------------------------------------"
	@echo "install   : Install the required packages using Bun"
	@echo "run       : Run the Riven Frontend development server"
	@echo "start     : Build and run the Riven Frontend container (requires Docker)"
	@echo "stop      : Stop and remove the Riven Frontend container (requires Docker)"
	@echo "restart   : Restart the Riven Frontend container (requires Docker)"
	@echo "logs      : Show the logs of the Riven Frontend container (requires Docker)"
	@echo "shell     : Open a shell in the running container (requires Docker)"
	@echo "build     : Build multi-architecture Docker image"
	@echo "push      : Build and push multi-architecture release image"
	@echo "push-dev  : Build and push multi-architecture dev image"
	@echo "push-branch: Build and push branch-specific image"
	@echo "push-custom-branch: Build and push to a custom branch name (usage: make push-custom-branch BRANCH=name)"
	@echo "tidy      : Remove dangling Docker images"
	@echo "clean     : Remove temporary files and directories"
	@echo "format    : Format the code"
	@echo "check     : Check the code"
	@echo "lint      : Lint the code"
	@echo "test      : Run the tests"
	@echo "update    : Update dependencies"
	@echo "diff      : Show diff between current and previous commit"
	@echo "-------------------------------------------------------------------------"

start: stop
	@docker compose -f docker-compose.yml up --build -d --force-recreate --remove-orphans
	@docker compose -f docker-compose.yml logs -f

stop:
	@docker compose -f docker-compose.yml down -v

restart:
	@docker restart riven-frontend
	@docker logs -f riven-frontend

logs:
	@docker logs -f riven-frontend


shell:
	@docker exec -it riven-frontend sh

# Ensure the Buildx builder is set up
setup-builder:
	@if ! docker buildx ls | grep -q "mybuilder"; then \
		echo "Creating Buildx builder..."; \
		docker buildx create --use --name mybuilder --driver docker-container; \
	else \
		echo "Using existing Buildx builder..."; \
	fi

# Build multi-architecture image (local only, no push)
build: setup-builder
	@docker buildx build --platform linux/amd64,linux/arm64 -t riven-frontend --load .

# Build and push multi-architecture release image
push: setup-builder
	@echo "Building and pushing release image to Docker Hub..."
	@docker buildx build --platform linux/amd64,linux/arm64 -t spoked/riven-frontend:latest --push .
	@echo "Image 'spoked/riven-frontend:latest' pushed to Docker Hub"

# Build and push multi-architecture dev image
push-dev: setup-builder
	@echo "Building and pushing dev image to Docker Hub..."
	@docker buildx build --platform linux/amd64,linux/arm64 -t spoked/riven-frontend:dev --push .
	@echo "Image 'spoked/riven-frontend:dev' pushed to Docker Hub"

push-branch: setup-builder
	@echo "Building and pushing branch '${BRANCH_NAME}' image to Docker Hub..."
	@docker buildx build --platform linux/amd64,linux/arm64 -t spoked/riven-frontend:${BRANCH_NAME} --push .
	@echo "Image 'spoked/riven-frontend:${BRANCH_NAME}' pushed to Docker Hub"

push-custom-branch: setup-builder
	@if [ -z "$(BRANCH)" ]; then \
		echo "Error: BRANCH parameter is required. Usage: make push-custom-branch BRANCH=branch-name"; \
		exit 1; \
	fi
	@echo "Building and pushing custom branch '$(BRANCH)' image to Docker Hub..."
	@docker buildx build --platform linux/amd64,linux/arm64 -t spoked/riven-frontend:$(BRANCH) --push .
	@echo "Image 'spoked/riven-frontend:$(BRANCH)' pushed to Docker Hub"

tidy:
	@docker rmi $(docker images | awk '$1 == "<none>" || $1 == "riven-frontend" {print $3}') -f


clean:
	@find . -type d -name 'node_modules' -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name '.svelte-kit' -exec rm -rf {} + 2>/dev/null || true

install:
	@bun install

update:
	@bun update

diff:
	@git diff HEAD~1 HEAD

# Run the application
run:
	@bun run dev

# Code quality commands
format:
	@bun run format

check:
	@bun run check

lint:
	@bun run lint

# Testing
test:
	@bun test