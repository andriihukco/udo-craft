# UDO Craft

A professional monorepo for custom print-on-demand products with admin and client applications.

## 🏗️ Architecture

This monorepo uses:
- **Turborepo** for efficient build orchestration
- **Next.js 14** for both admin and client apps
- **shadcn/ui** for consistent UI components
- **Supabase** for backend services
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## 📁 Project Structure

```
udo-craft/
├── apps/
│   ├── admin/           # Admin dashboard
│   └── client/          # Customer-facing app
├── packages/
│   ├── shared/          # Shared types and schemas
│   ├── ui/              # Shared UI components
│   ├── config/          # Shared configuration
│   └── styles/          # Global styles
├── .github/workflows/   # CI/CD pipelines
└── tests/               # E2E tests and fixtures
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

## 📦 Scripts

- `npm run dev` - Start both admin and client in development
- `npm run build` - Build all packages and apps
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages
- `npm run test` - Run unit tests with coverage
- `npm run test:e2e` - Run Playwright E2E tests

## 🧪 Testing

- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Vitest coverage reports

## 🚀 Deployment

### Staging
- Push to `develop` branch → Auto-deploy to staging

### Production
- Push to `main` branch → Auto-deploy to production

## 📋 Environment Variables

See `.env.example` files in each app for required environment variables.

## 🔧 Development

### Adding New Components
1. Add to `packages/ui/components/ui/`
2. Export from `packages/ui/components/ui/index.ts`
3. Use in apps via `@udo-craft/ui`

### Shared Types
Add new types to `packages/shared/index.ts`

### Global Styles
Modify `packages/styles/globals.css`

## 📊 CI/CD

- **Type checking** on all PRs
- **Linting** on all PRs  
- **Unit tests** with coverage reporting
- **E2E tests** on build artifacts
- **Automated deployment** to staging/production
