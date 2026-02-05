#!/bin/bash
set -e

echo "🔨 Building frontend..."
cd frontend
bun run build

echo "🔨 Building backend..."
cd ../backend
bun run build

echo "🗄️ Running migrations..."
bun run migrations/run.ts

echo "🚀 Starting server..."
bun start
