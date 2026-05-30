#!/bin/bash

# Food Price Comparison Monorepo Setup Script

set -e

echo "🚀 Setting up Food Price Comparison Monorepo..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Check if Node.js version is correct
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ pnpm version: $(pnpm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build shared types package first
echo "🔨 Building shared types package..."
pnpm --filter @shared/types build

# Copy environment files
echo "📝 Setting up environment files..."
if [ ! -f "apps/backend-api/.env" ]; then
    cp apps/backend-api/env.example apps/backend-api/.env
    echo "✅ Created apps/backend-api/.env from template"
else
    echo "ℹ️  apps/backend-api/.env already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p apps/chrome-extension/dist
mkdir -p apps/backend-api/dist
mkdir -p packages/shared-types/dist

echo "✅ Setup complete!"
echo ""
echo "🎉 You can now start developing:"
echo "  pnpm dev                    # Start all services"
echo "  pnpm --filter chrome-extension dev  # Start only Chrome extension"
echo "  pnpm --filter backend-api dev       # Start only backend API"
echo ""
echo "📚 For more information, see README.md"
