#!/bin/bash

# Development script for Food Price Comparison Monorepo

set -e

echo "🚀 Starting Food Price Comparison development environment..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "  brew services start mongodb-community"
    echo "  or"
    echo "  docker run -d -p 27017:27017 mongo:7.0"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start all services in parallel
echo "🔄 Starting all services..."

# Start shared types in watch mode
echo "📦 Starting shared types watcher..."
pnpm --filter @shared/types dev &
SHARED_TYPES_PID=$!

# Wait a moment for shared types to build
sleep 2

# Start backend API
echo "🔧 Starting backend API..."
pnpm --filter food-price-comparison-api dev &
BACKEND_PID=$!

# Start Chrome extension
echo "🌐 Starting Chrome extension..."
pnpm --filter food-price-comparison-extension dev &
EXTENSION_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Services running:"
echo "  - Shared Types: Building in watch mode"
echo "  - Backend API: http://localhost:3000"
echo "  - Chrome Extension: Building in watch mode"
echo ""
echo "🛑 To stop all services, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $SHARED_TYPES_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    kill $EXTENSION_PID 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
