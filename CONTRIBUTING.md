# Contributing to Claude Cascade

Thank you for your interest in contributing to Claude Cascade! This document provides guidelines for contributing to the project and helps ensure a smooth collaboration process.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Documentation Guidelines](#documentation-guidelines)
- [Community](#community)

## Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites
- Bash (for Unix/macOS) or PowerShell (for Windows)
- Git for version control
- Basic understanding of three-phase planning methodology
- Familiarity with software development workflows

### Installation for Development
1. **Clone the repository:**
   ```bash
   git clone https://github.com/anthropic/claude-cascade.git
   cd claude-cascade
   ```

2. **Run the installer:**
   ```bash
   # On Unix/macOS
   ./install.sh
   
   # On Windows
   .\install.ps1
   ```

3. **Verify installation:**
   ```bash
   claude-cascade --version
   claude-cascade init test-project
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

#### 🐛 Bug Reports
- Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include steps to reproduce, expected behavior, and actual behavior
- Provide system information (OS, Claude Code version, etc.)

#### ✨ Feature Requests
- Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
- Explain the problem you're trying to solve
- Describe your proposed solution
- Consider how it fits with the three-phase methodology

#### 📖 Documentation Improvements
- Fix typos, clarify instructions, or add missing information
- Improve example workflows or add new ones
- Enhance template documentation

#### 🔧 Code Contributions
- Bug fixes and improvements to existing functionality
- New features that align with project goals
- Performance optimizations
- Test coverage improvements

#### 📝 Template Contributions
- New domain-specific planning templates
- Enhanced verification procedures
- Analytics and reporting improvements

### Contribution Process

1. **Check existing issues** to avoid duplicating work
2. **Create an issue** for discussion before starting significant work
3. **Fork the repository** and create a feature branch
4. **Make your changes** following our guidelines
5. **Test your changes** thoroughly
6. **Submit a pull request** with a clear description

## Development Workflow

### Branch Naming
Use descriptive branch names that indicate the type and scope of changes:
```
feature/enhanced-analytics-dashboard
bugfix/template-validation-error
docs/contributing-guidelines
```

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
feat: add enhanced analytics dashboard with team metrics
fix: resolve template validation error in complex projects
docs: update contributing guidelines with new workflow
```

### Pull Request Guidelines

#### Before Submitting
- [ ] Code follows project style guidelines
- [ ] All tests pass (if applicable)
- [ ] Documentation is updated for any new features
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with main

#### Pull Request Template
Use our [Pull Request Template](.github/pull_request_template.md) and include:
- **Description**: What changes does this PR introduce?
- **Motivation**: Why is this change needed?
- **Testing**: How was this change tested?
- **Breaking Changes**: Any breaking changes for users?
- **Screenshots**: For UI changes (if applicable)

### Code Style Guidelines

#### Shell Scripts
- Use 2-space indentation
- Include error handling with `set -e`
- Add comments for complex logic
- Test on both bash and zsh

#### Documentation
- Use clear, concise language
- Include practical examples
- Follow existing formatting patterns
- Test all commands and procedures

#### Templates
- Follow the three-phase structure consistently
- Include comprehensive success criteria
- Provide realistic time estimates
- Add verification procedures

## Documentation Guidelines

### Writing Style
- **Be clear and concise**: Use simple language and short sentences
- **Be practical**: Include real examples and actionable steps
- **Be comprehensive**: Cover edge cases and troubleshooting
- **Be consistent**: Follow existing patterns and terminology

### Template Documentation
When contributing new templates:
1. **Include a README.md** explaining the template's purpose and usage
2. **Provide realistic examples** showing the template in action
3. **Document success criteria** and verification procedures
4. **Include time estimates** based on real project experience

### Code Documentation
- Comment complex logic and decisions
- Include usage examples in script headers
- Document function parameters and return values
- Explain any non-obvious dependencies

## Testing Guidelines

### Manual Testing
All contributions should be manually tested:
1. **Installation testing** on clean systems
2. **Template validation** with real project scenarios
3. **Cross-platform testing** (Windows, macOS, Linux)
4. **Hook integration testing** with Claude Code

### Documentation Testing
- Verify all commands work as documented
- Test installation procedures on fresh systems
- Validate example outputs match real results
- Ensure links and references are correct

## Community Guidelines

### Communication
- **Be respectful**: Treat all community members with respect
- **Be patient**: Remember that contributors have varying experience levels
- **Be constructive**: Provide helpful feedback and suggestions
- **Be inclusive**: Welcome newcomers and help them get started

### Getting Help
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check existing docs before asking questions

### Recognition
We recognize contributors in several ways:
- Contributor list in README.md
- Release notes for significant contributions
- Special recognition for outstanding contributions

## Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Schedule
- **Patch releases**: As needed for critical bug fixes
- **Minor releases**: Monthly for new features
- **Major releases**: Quarterly for significant changes

## Advanced Contributions

### New Feature Development
For significant new features:
1. **Create a design document** outlining the feature
2. **Discuss with maintainers** before implementation
3. **Consider backwards compatibility** and migration paths
4. **Include comprehensive testing** and documentation

### Template Development
When creating new domain-specific templates:
1. **Research industry best practices** for the domain
2. **Create realistic examples** based on real projects
3. **Include domain-specific success criteria**
4. **Provide verification procedures** relevant to the domain

### Analytics and Reporting
For analytics contributions:
1. **Focus on actionable insights** rather than vanity metrics
2. **Ensure privacy compliance** and data protection
3. **Provide clear visualization** and interpretation
4. **Include trend analysis** and predictive capabilities

## Questions?

If you have questions about contributing, please:
1. Check our [documentation](docs/)
2. Search [existing issues](https://github.com/anthropic/claude-cascade/issues)
3. Create a new [discussion](https://github.com/anthropic/claude-cascade/discussions)
4. Reach out to maintainers

Thank you for contributing to Claude Cascade and helping make systematic planning accessible to developers everywhere!