# Food Price Comparison Monorepo

A comprehensive monorepo for a food price comparison Chrome extension with a Node.js backend API.

## 🏗️ Architecture

This monorepo contains:

- **Chrome Extension** (`apps/chrome-extension/`) - React + TypeScript + Vite
- **Backend API** (`apps/backend-api/`) - Node.js + Express + TypeScript
- **Shared Types** (`packages/shared-types/`) - TypeScript types shared across packages

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web5
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Copy environment files
cp apps/backend-api/env.example apps/backend-api/.env
```

4. Start the development environment:
```bash
# Start all services
pnpm dev

# Or start individual services
pnpm --filter @shared/types dev
pnpm --filter food-price-comparison-extension dev
pnpm --filter food-price-comparison-api dev
```

## 📦 Packages

### Shared Types (`packages/shared-types/`)

Contains TypeScript interfaces and types shared between the frontend and backend.

```bash
cd packages/shared-types
pnpm build
```

### Chrome Extension (`apps/chrome-extension/`)

A React-based Chrome extension for comparing food prices.

**Features:**
- Product search and comparison
- Price tracking across multiple stores
- User preferences and settings
- Content script for price extraction

**Development:**
```bash
cd apps/chrome-extension
pnpm dev
```

**Build:**
```bash
pnpm build
```

**Install in Chrome:**
1. Build the extension: `pnpm build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

### Backend API (`apps/backend-api/`)

A Node.js API server with Express and MongoDB.

**Features:**
- RESTful API for food items, prices, and stores
- User authentication and preferences
- Price scraping service
- Search and filtering capabilities

**Development:**
```bash
cd apps/backend-api
pnpm dev
```

**Production:**
```bash
pnpm build
pnpm start
```

## 🐳 Docker

### Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Image

```bash
# Build the backend image
docker build -f apps/backend-api/Dockerfile -t food-price-api .

# Run the container
docker run -p 3000:3000 food-price-api
```

## 🧪 Testing

Run tests for all packages:

```bash
pnpm test
```

Run tests for a specific package:

```bash
pnpm --filter @shared/types test
pnpm --filter food-price-comparison-extension test
pnpm --filter food-price-comparison-api test
```

## 🔧 Development Scripts

### Root Level Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Format all code
pnpm format

# Type check all packages
pnpm type-check

# Clean all build artifacts
pnpm clean
```

### Package-Specific Commands

```bash
# Run commands for specific packages
pnpm --filter <package-name> <command>

# Examples:
pnpm --filter @shared/types build
pnpm --filter food-price-comparison-extension dev
pnpm --filter food-price-comparison-api test
```

## 📁 Project Structure

```
web5/
├── packages/
│   └── shared-types/          # Shared TypeScript types
├── apps/
│   ├── chrome-extension/       # Chrome extension (React + Vite)
│   └── backend-api/           # Backend API (Node.js + Express)
├── scripts/                    # Utility scripts
├── .github/
│   └── workflows/             # GitHub Actions CI/CD
├── docker-compose.yml         # Docker development setup
├── package.json               # Root package.json
├── tsconfig.json              # Root TypeScript config
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in `apps/backend-api/`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/food-price-comparison

# Security
JWT_SECRET=your-super-secret-jwt-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Chrome Extension Configuration

The extension is configured in `apps/chrome-extension/manifest.json` with permissions for:
- Active tab access
- Storage for user preferences
- Scripting for content injection
- Host permissions for supported grocery stores

## 🚀 Deployment

### Backend API

1. **Docker Deployment:**
```bash
docker build -f apps/backend-api/Dockerfile -t food-price-api .
docker run -p 3000:3000 food-price-api
```

2. **Environment Variables:**
Set the following environment variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`

### Chrome Extension

1. Build the extension:
```bash
cd apps/chrome-extension
pnpm build
```

2. Package for distribution:
```bash
# Create a zip file for Chrome Web Store
zip -r chrome-extension.zip dist/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/your-username/food-price-comparison/issues) page
2. Create a new issue if your problem isn't already reported
3. Join our community discussions

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced price analytics
- [ ] Machine learning for price prediction
- [ ] Integration with more grocery stores
- [ ] Social features (price sharing, reviews)
- [ ] Offline support for Chrome extension
