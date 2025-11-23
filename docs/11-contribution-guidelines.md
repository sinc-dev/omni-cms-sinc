# Contribution Guidelines

## Overview

Thank you for your interest in contributing to Omni-CMS! This document provides guidelines for contributing to the project.

## Getting Started

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/omni-cms.git
   cd omni-cms/web
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your values
   ```

4. **Set Up Database**
   ```bash
   # Create local D1 database
   wrangler d1 create omni-cms --local
   
   # Generate and run migrations
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/` - Feature branches
- `fix/` - Bug fix branches
- `docs/` - Documentation updates

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run linter
   pnpm lint
   
   # Type check
   pnpm tsc --noEmit
   
   # Test locally
   pnpm dev
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(posts): add draft status filtering
fix(auth): resolve JWT validation error
docs(api): update public API documentation
refactor(ui): simplify toast notification component
```

### Pull Request Process

1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use descriptive title
   - Explain what and why
   - Reference related issues
   - Include screenshots if UI changes

3. **Review Feedback**
   - Address review comments
   - Update PR as needed
   - Keep PR focused and scoped

4. **Merge**
   - Squash and merge (preferred)
   - Delete branch after merge

## Code Style

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types; use proper types
- Use interfaces for object shapes
- Prefer `const` over `let`
- Use meaningful variable names

### React

- Use functional components
- Use hooks for state and effects
- Extract reusable components
- Keep components focused and small
- Use proper prop types

### File Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── admin/       # Admin-specific components
├── lib/              # Utilities and helpers
├── db/               # Database schemas
└── types/            # TypeScript types
```

### Naming Conventions

- **Files**: `kebab-case.ts` or `PascalCase.tsx` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Formatting

- Use Prettier (configured via ESLint)
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in multi-line structures

## Testing

### Writing Tests

- Test critical functionality
- Test error cases
- Test edge cases
- Keep tests simple and focused

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain non-obvious code
- Update comments when code changes

### User Documentation

- Update user manual for UI changes
- Update API docs for endpoint changes
- Add troubleshooting entries for new issues
- Keep examples up to date

## Database Changes

### Schema Changes

1. **Modify Schema**
   - Edit schema files in `src/db/schema/`
   - Follow existing patterns
   - Add appropriate indexes

2. **Generate Migration**
   ```bash
   pnpm db:generate
   ```

3. **Review Migration**
   - Check generated SQL
   - Verify indexes are created
   - Test migration locally

4. **Test Migration**
   ```bash
   pnpm db:migrate
   ```

5. **Commit**
   - Include schema changes
   - Include migration files
   - Document breaking changes

### Migration Guidelines

- Never modify existing migrations
- Create new migrations for changes
- Test migrations up and down
- Document data migration steps if needed
- Consider backward compatibility

## Security

### Security Guidelines

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate all user inputs
- Sanitize data before database operations
- Follow OWASP best practices

### Reporting Security Issues

Report security vulnerabilities privately:
- Email: security@example.com
- Include detailed description
- Include steps to reproduce
- Wait for response before disclosure

## Performance

### Performance Guidelines

- Optimize database queries
- Use pagination for large datasets
- Implement caching where appropriate
- Optimize images and assets
- Minimize bundle size

### Performance Testing

- Test with realistic data volumes
- Monitor query performance
- Check bundle sizes
- Profile slow operations

## Accessibility

### Accessibility Guidelines

- Follow WCAG 2.1 Level AA
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast

## Questions?

- Open an issue for questions
- Check existing documentation
- Review similar code in codebase
- Ask maintainers for guidance

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

