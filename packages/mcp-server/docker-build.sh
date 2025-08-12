# scripts/docker-build.sh
#!/bin/bash

# Build script for Docker images

set -e

echo "Building MCP Server Docker images..."

# Build production image
echo "Building production image..."
docker build -t mcp-server:latest .

# Build development image
echo "Building development image..."
docker build -f Dockerfile.dev -t mcp-server:dev .

# Tag with version if provided
if [ ! -z "$1" ]; then
    echo "Tagging with version: $1"
    docker tag mcp-server:latest mcp-server:$1
fi

echo "Docker images built successfully!"
echo "Production image: mcp-server:latest"
echo "Development image: mcp-server:dev"

# scripts/docker-run.sh
#!/bin/bash

# Run script for Docker containers

set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Please edit .env file with your configuration"
    else
        echo "Error: .env.example not found"
        exit 1
    fi
fi

# Default to production mode
MODE=${1:-production}

if [ "$MODE" = "development" ] || [ "$MODE" = "dev" ]; then
    echo "Starting MCP Server in development mode..."
    docker-compose -f docker-compose.dev.yml up --build
elif [ "$MODE" = "production" ] || [ "$MODE" = "prod" ]; then
    echo "Starting MCP Server in production mode..."
    docker-compose up --build -d
    echo "MCP Server is running in background"
    echo "View logs: docker-compose logs -f mcp-server"
    echo "Stop server: docker-compose down"
else
    echo "Usage: $0 [development|production]"
    echo "Default: production"
    exit 1
fi

# Makefile
.PHONY: build run stop clean logs shell

# Docker commands
build:
	docker build -t mcp-server:latest .

build-dev:
	docker build -f Dockerfile.dev -t mcp-server:dev .

run:
	docker-compose up -d

run-dev:
	docker-compose -f docker-compose.dev.yml up

stop:
	docker-compose down

clean:
	docker-compose down -v
	docker image prune -f

logs:
	docker-compose logs -f mcp-server

shell:
	docker-compose exec mcp-server sh

# Development commands
dev:
	npm run dev

build-local:
	npm run build

install:
	npm ci

# Production deployment
deploy:
	./scripts/docker-build.sh
	docker-compose up -d

# Health check
health:
	curl -f http://localhost:3000/health || exit 1
