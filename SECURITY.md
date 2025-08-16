# Security Policy

## Supported Versions

We actively support the following versions of Claude Cascade with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The Claude Cascade team takes security seriously. We appreciate your efforts to responsibly disclose security vulnerabilities.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by emailing:
**claude-cascade-security@anthropic.com**

### What to Include

When reporting a vulnerability, please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up

### Example Report Format

```
Subject: [SECURITY] Potential vulnerability in planning template validation

Description:
A potential code injection vulnerability exists in the template validation 
system when processing user-provided planning templates.

Steps to Reproduce:
1. Create a planning template with malicious shell code in the verification section
2. Run claude-cascade validate template.md
3. Observe that shell code is executed during validation

Potential Impact:
- Remote code execution on developer machines
- Compromise of development environments
- Potential access to sensitive project information

Suggested Fix:
Implement proper input sanitization and use safe parsing methods for 
template validation.

Contact: researcher@example.com
```

## Security Considerations

### Planning Template Security

Since Claude Cascade integrates with development workflows, be aware of:

1. **Code Execution**: Planning templates may contain shell commands that get executed
2. **Sensitive Information**: Planning documents may contain sensitive project details
3. **File System Access**: Templates may reference files containing confidential information
4. **Hook Integration**: Claude Code hooks execute with developer permissions

### Best Practices for Users

#### Template Security
- **Review templates** before using them from external sources
- **Avoid sensitive data** in planning documents that may be shared
- **Use generic examples** when sharing templates publicly
- **Validate commands** in templates before execution

#### Environment Security
- **Use dedicated environments** for planning execution when possible
- **Limit file system access** for template processing
- **Review hook configurations** before enabling them
- **Keep Claude Cascade updated** to receive security patches

#### Data Protection
- **Encrypt sensitive planning documents** when storing them
- **Use access controls** for shared planning repositories
- **Regularly review** who has access to planning documents
- **Consider data retention policies** for completed projects

### Security Features

#### Built-in Protections
- **Template validation** checks for common security issues
- **Command sanitization** for shell command execution
- **File path validation** to prevent directory traversal
- **Input validation** for user-provided data

#### Integration Security
- **Claude Code hook validation** ensures hooks are from trusted sources
- **Minimal permission requests** for file system access
- **Sandboxed execution** where possible for template processing
- **Audit logging** for security-relevant operations

## Response Process

### Initial Response
We aim to respond to security reports within **24 hours** with:
- Acknowledgment of receipt
- Initial assessment of the report
- Timeline for further investigation

### Investigation Process
1. **Verification** of the reported vulnerability
2. **Impact assessment** and severity scoring
3. **Fix development** and testing
4. **Coordinated disclosure** preparation

### Disclosure Timeline
- **Day 0**: Vulnerability reported
- **Day 1**: Initial response and triage
- **Days 1-7**: Investigation and fix development
- **Days 7-14**: Testing and validation
- **Day 14+**: Coordinated public disclosure (if applicable)

### Severity Assessment

We use the following severity levels:

#### Critical
- Remote code execution vulnerabilities
- Privilege escalation exploits
- Data breach potential

#### High
- Local code execution vulnerabilities
- Unauthorized data access
- Authentication bypasses

#### Medium
- Information disclosure
- Denial of service vulnerabilities
- Configuration weaknesses

#### Low
- Minor information leaks
- Limited impact vulnerabilities

## Security Updates

### Notification Channels
Security updates will be announced through:
- **GitHub Security Advisories** for the repository
- **Release notes** with security fix details
- **Email notifications** to maintainers and contributors

### Update Process
When security updates are released:
1. **Update immediately** to the latest version
2. **Review changes** in the security advisory
3. **Test your integrations** to ensure compatibility
4. **Update dependencies** if required

## Security Research

We welcome security research on Claude Cascade under responsible disclosure:

### Scope
Security research is welcome on:
- Claude Cascade core functionality
- Template processing and validation
- Hook integration mechanisms
- File system interactions
- Shell command execution

### Out of Scope
Please do not test:
- Claude Code itself (report to Anthropic directly)
- Third-party systems or services
- Social engineering attacks
- Physical security testing

### Recognition
We recognize security researchers who help improve Claude Cascade:
- **Public acknowledgment** in security advisories (with permission)
- **Contributor recognition** in project documentation
- **Direct communication** with the development team

## Contact Information

- **Security Reports**: claude-cascade-security@anthropic.com
- **General Security Questions**: claude-cascade-team@anthropic.com
- **Public Discussion**: GitHub Issues (for non-sensitive security topics)

## Additional Resources

- [Anthropic Security Policy](https://www.anthropic.com/security)
- [Claude Code Security Documentation](https://docs.anthropic.com/claude-code/security)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

Thank you for helping keep Claude Cascade and its users secure!