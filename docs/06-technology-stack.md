# Technology Stack & Dependencies

## Overview

This document details the complete technology stack, dependencies, and tooling used in the Omni-CMS project.

## Frontend Stack

### Core Framework
- **Next.js 14+**: React framework with App Router
  - Version: `^14.0.0`
  - Features: Server Components, Server Actions, API Routes
  - Deployment: Optimized for Cloudflare Pages

### Language
- **TypeScript**: Strongly typed JavaScript
  - Version: `^5.0.0`
  - Configuration: Strict mode enabled
  - Benefits: Type safety, better IDE support, fewer runtime errors

### Styling
- **Tailwind CSS**: Utility-first CSS framework
  - Version: `^3.4.0`
  - Plugins: `@tailwindcss/typography`, `@tailwindcss/forms`
  - Configuration: Custom theme, dark mode support

### UI Components
- **shadcn/ui**: High-quality React components
  - Built on Radix UI primitives
  - Fully customizable with Tailwind CSS
  - Components: Button, Dialog, Form, Table, Select, etc.

### Rich Text Editor
- **TipTap**: Headless rich text editor
  - Version: `^2.1.0`
  - Extensions:
    - `@tiptap/starter-kit`: Basic formatting
    - `@tiptap/extension-image`: Image support
    - `@tiptap/extension-link`: Link support
    - `@tiptap/extension-table`: Table support
    - `@tiptap/extension-code-block-lowlight`: Code highlighting
    - `@tiptap/extension-placeholder`: Placeholder text
  - Features: Markdown shortcuts, slash commands, bubble menu

### Form Management
- **React Hook Form**: Performant form library
  - Version: `^7.48.0`
  - Benefits: Minimal re-renders, easy validation
- **Zod**: TypeScript-first schema validation
  - Version: `^3.22.0`
  - Integration: `@hookform/resolvers/zod`

### State Management
- **React Context**: Built-in state management
  - Organization context
  - User context
  - Theme context
- **TanStack Query (React Query)**: Server state management
  - Version: `^5.0.0`
  - Features: Caching, background updates, optimistic updates

### Icons
- **Lucide React**: Icon library
  - Version: `^0.294.0`
  - Benefits: Tree-shakeable, consistent design

---

## Backend Stack

### Runtime Environment
- **Cloudflare Workers**: Edge runtime (if needed)
- **Next.js API Routes**: API endpoints
  - Deployed to Cloudflare Pages

### Database
- **Cloudflare D1**: SQLite database at the edge
  - Features: Global distribution, low latency
  - Limitations: 10GB per database, 100k rows per query

### ORM
- **Drizzle ORM**: TypeScript ORM for SQL databases
  - Version: `^0.29.0`
  - Packages:
    - `drizzle-orm`: Core ORM
    - `drizzle-kit`: Migration toolkit
  - Features:
    - Type-safe queries
    - SQL-like syntax
    - Migration generation
    - Cloudflare D1 support

### Storage
- **Cloudflare R2**: S3-compatible object storage
  - Features: Zero egress fees, global distribution
  - SDK: `@cloudflare/workers-types`

### Image Processing
- **Cloudflare Images**: Image optimization service
  - Features: Automatic resizing, format conversion, CDN delivery
  - Alternative: `sharp` for local processing

---

## Authentication & Security

### Authentication
- **Cloudflare Access**: Zero Trust authentication
  - Features: SSO, MFA, identity providers
  - Supported providers: Google, GitHub, Email OTP, SAML

### Security Libraries
- **jose**: JWT validation
  - Version: `^5.1.0`
  - Features: JWT signing, verification, encryption
- **bcrypt**: Password hashing (for API keys)
  - Version: `^5.1.0`

---

## Development Tools

### Package Manager
- **pnpm**: Fast, disk space efficient package manager
  - Version: `^8.0.0`
  - Benefits: Faster installs, better monorepo support

### Code Quality
- **ESLint**: JavaScript/TypeScript linter
  - Version: `^8.54.0`
  - Config: `eslint-config-next`
  - Plugins: `@typescript-eslint`, `eslint-plugin-react`
- **Prettier**: Code formatter
  - Version: `^3.1.0`
  - Integration: `eslint-config-prettier`

### TypeScript Tools
- **ts-node**: TypeScript execution
  - Version: `^10.9.0`
- **tsx**: Enhanced TypeScript execution
  - Version: `^4.7.0`

### Git Hooks
- **Husky**: Git hooks manager
  - Version: `^8.0.0`
- **lint-staged**: Run linters on staged files
  - Version: `^15.2.0`

---

## Cloudflare Infrastructure

### Cloudflare Pages
- **Deployment**: Automatic deployments from Git
- **Build Command**: `pnpm run build`
- **Output Directory**: `.vercel/output/static` (Next.js adapter)
- **Environment Variables**: Managed via Cloudflare dashboard

### Cloudflare D1
- **Database**: SQLite at the edge
- **Bindings**: Access via `env.DB`
- **Migrations**: Managed via `wrangler d1 migrations`

### Cloudflare R2
- **Bucket**: Media storage
- **Bindings**: Access via `env.R2_BUCKET`
- **Public Access**: Via custom domain or R2.dev subdomain

### Cloudflare Workers (Optional)
- **Use Cases**: Background jobs, webhooks, custom logic
- **Runtime**: V8 isolates
- **Bindings**: D1, R2, KV, Durable Objects

### Wrangler
- **Version**: `^3.22.0`
- **Purpose**: Cloudflare development and deployment CLI
- **Commands**:
  - `wrangler d1 create`: Create database
  - `wrangler d1 migrations apply`: Run migrations
  - `wrangler r2 bucket create`: Create R2 bucket
  - `wrangler pages deploy`: Deploy to Pages

---

## Complete Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3",
    
    "@cloudflare/workers-types": "^4.20231218.0",
    "drizzle-orm": "^0.29.1",
    
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "@tiptap/extension-image": "^2.1.13",
    "@tiptap/extension-link": "^2.1.13",
    "@tiptap/extension-table": "^2.1.13",
    "@tiptap/extension-table-row": "^2.1.13",
    "@tiptap/extension-table-cell": "^2.1.13",
    "@tiptap/extension-table-header": "^2.1.13",
    "@tiptap/extension-code-block-lowlight": "^2.1.13",
    "@tiptap/extension-placeholder": "^2.1.13",
    "lowlight": "^3.1.0",
    
    "@tanstack/react-query": "^5.14.2",
    "react-hook-form": "^7.49.2",
    "@hookform/resolvers": "^3.3.3",
    "zod": "^3.22.4",
    
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-avatar": "^1.0.4",
    
    "lucide-react": "^0.294.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    
    "jose": "^5.1.3",
    "bcrypt": "^5.1.1",
    "nanoid": "^5.0.4",
    "date-fns": "^3.0.6"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "@types/bcrypt": "^5.0.2",
    
    "drizzle-kit": "^0.20.9",
    "wrangler": "^3.22.1",
    
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "@tailwindcss/typography": "^0.5.10",
    "@tailwindcss/forms": "^0.5.7",
    
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4",
    "eslint-config-prettier": "^9.1.0",
    "@typescript-eslint/eslint-plugin": "^6.16.0",
    "@typescript-eslint/parser": "^6.16.0",
    
    "prettier": "^3.1.1",
    "prettier-plugin-tailwindcss": "^0.5.9",
    
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    
    "tsx": "^4.7.0"
  }
}
```

---

## Configuration Files

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflareimages.com',
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... other colors
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

export default config
```

### `drizzle.config.ts`
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: 'wrangler.toml',
    dbName: 'omni-cms',
  },
} satisfies Config
```

### `wrangler.toml`
```toml
name = "omni-cms"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "omni-cms"
database_id = "<database-id>"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "omni-cms-media"
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Environment Variables

### Development (`.env.local`)
```bash
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Database
DATABASE_ID=your-d1-database-id

# R2 Storage
R2_BUCKET_NAME=omni-cms-media
R2_PUBLIC_URL=https://media.example.com

# Cloudflare Access
CF_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
CF_ACCESS_AUD=your-access-aud

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production
Same variables but with production values, managed via Cloudflare Pages dashboard.

---

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari 14+, Chrome Android
- **Not Supported**: IE11, older browsers

---

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: > 90
- **API Response Time**: < 200ms (p95)
- **Image Load Time**: < 1s

---

## Accessibility Standards

- **WCAG 2.1 Level AA** compliance
- **Keyboard Navigation**: Full support
- **Screen Readers**: ARIA labels, semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio
