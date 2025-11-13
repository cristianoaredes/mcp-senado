# Contributing to MCP Senado Federal

Thank you for your interest in contributing to MCP Senado Federal! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:
- Clear description of the feature
- Use cases and benefits
- Potential implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/cristianoaredes/mcp-senado.git
cd mcp-senado

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run tests
npm test

# Build the project
npm run build
```

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Testing

- Write unit tests for new features
- Maintain test coverage above 70%
- Run tests before submitting PR: `npm test`
- Run linting: `npm run lint`

## Commit Messages

Use clear and descriptive commit messages:
- `feat: add new senator tool`
- `fix: resolve caching issue`
- `docs: update README`
- `test: add voting tools tests`
- `refactor: improve error handling`

## Documentation

- Update README.md for user-facing changes
- Update API documentation for new tools
- Add JSDoc comments for public APIs
- Update CHANGELOG.md

## Questions?

Feel free to open an issue for questions or reach out to the maintainer.

Thank you for contributing! 🎉
