# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Cute or Not seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Please report security vulnerabilities by emailing:
- info@catto.at

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of issue (e.g., SQL injection, XSS, authentication bypass, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 72-96 hours
- **Communication**: We will keep you informed about the progress of fixing the vulnerability
- **Fix Timeline**: We aim to fix critical vulnerabilities within 7 days
- **Disclosure**: We will coordinate with you on the disclosure timeline

## Security Best Practices for Contributors

When contributing to this project, please follow these security best practices:

### Database Security
- Always use parameterized queries (we use pg's built-in parameterization)
- Never construct SQL queries with string concatenation
- Validate all user inputs before database operations

### Authentication & Authorization
- Never commit credentials or API keys
- Use environment variables for sensitive configuration
- Implement proper rate limiting for all endpoints

### Input Validation
- Sanitize all user inputs
- Validate image URLs before processing
- Implement proper CSRF protection if adding forms

### Dependencies
- Keep all dependencies up to date
- Review dependency licenses and security advisories
- Use `npm audit` regularly to check for vulnerabilities

## Security Features

This application includes several security features:

1. **Rate Limiting**: Prevents vote spam (15 votes per minute per IP)
2. **SQL Injection Protection**: All queries use parameterized statements
3. **XSS Protection**: User inputs are properly escaped
4. **Image Validation**: Only processes images from trusted sources
5. **Hash Verification**: Prevents duplicate image submissions

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request.

## Acknowledgments

We would like to thank the following individuals for responsibly disclosing security issues:

-theKanu

---

Thank you for helping keep Cute or Not and our users safe! 🔒🐱