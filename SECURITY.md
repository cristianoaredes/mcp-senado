# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to cristiano@aredes.me. Please do not create a public GitHub issue.

We will respond to your report within 48 hours and work with you to understand and resolve the issue promptly.

## Security Measures

This project implements several security measures:

- Input validation using Zod schemas
- PII masking in logs
- Rate limiting to prevent abuse
- LGPD compliance for Brazilian data protection
- No storage of personal data
- Secure API communication over HTTPS

## Best Practices

When using this MCP server:

- Keep your dependencies up to date
- Use environment variables for sensitive configuration
- Enable rate limiting in production
- Monitor logs for suspicious activity
- Follow the principle of least privilege
