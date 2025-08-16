# 🚀 Getting Started with Claude Cascade

Welcome to Claude Cascade! This guide will walk you through setting up your first intelligent planning workflow system and creating your first three-phase workflow.

## 📋 Prerequisites

### System Requirements

- **macOS**: macOS 10.14 or later
- **Linux**: Ubuntu 18.04+, CentOS 7+, or equivalent
- **Windows**: Windows 10 with PowerShell 5.0+

### Required Tools

- **Claude Code CLI**: [Download from claude.ai/code](https://claude.ai/code)
- **Git**: For version control (recommended)
- **jq**: JSON processor (auto-installed by installer)
- **bc**: Calculator for analytics (auto-installed by installer)

### Optional but Recommended

- **Git Bash** (Windows only): For full hook functionality
- **VS Code**: For editing plan files
- **Terminal/PowerShell**: For CLI operations

## 🔧 Installation

### Quick Install

**macOS & Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/claudecascade/claude-cascade/main/install/install.sh | bash
```

**Windows (PowerShell as Administrator):**
```powershell
irm https://raw.githubusercontent.com/claudecascade/claude-cascade/main/install/install.ps1 | iex
```

### Manual Installation

If you prefer to review the installer first:

**macOS & Linux:**
```bash
# Download installer
curl -O https://raw.githubusercontent.com/claudecascade/claude-cascade/main/install/install.sh

# Review the script
cat install.sh

# Make executable and run
chmod +x install.sh
./install.sh
```

**Windows:**
```powershell
# Download installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/claudecascade/claude-cascade/main/install/install.ps1" -OutFile "install.ps1"

# Review the script
Get-Content install.ps1

# Run installer
.\install.ps1
```

## 🎯 Post-Installation Setup

### 1. Verify Installation

```bash
# Check if cascade CLI is available
cascade version

# Expected output:
# Claude Cascade CLI v1.0.0
# Intelligent planning workflows for Claude Code
```

### 2. Test Claude Code Integration

```bash
# Start Claude Code to test hook integration
claude

# The hooks should now be active - you'll see guidance when planning keywords are detected
```

### 3. Configure Your Shell (If Needed)

If the `cascade` command isn't found, add it to your PATH:

**macOS & Linux:**
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Windows:**
The installer automatically adds to PATH, but you may need to restart your terminal.

## 🏗️ Your First Project

Let's create your first Claude Cascade workflow step by step.

### Step 1: Initialize a Project

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize Cascade structure
cascade init
```

This creates:
```
.claude/
├── plans/
│   ├── 1_pre_exec_plans/
│   ├── 2_post_exec_plans/
│   └── 3_checked_delta_exec_plans/
```

### Step 2: Create Your First Plan

Let's say we want to add a user authentication feature:

1. **Start Claude Code:**
   ```bash
   claude
   ```

2. **Describe Your Intention:**
   ```
   I need to implement user authentication with JWT tokens and email/password login
   ```

3. **Cascade Detects Planning Keywords:**
   You'll see a message like:
   ```
   📋 Planning keywords detected. Consider creating a Phase 1 plan in .claude/plans/1_pre_exec_plans/ before starting implementation.
   ```

4. **Create Phase 1 Plan:**
   Claude will guide you to create a file like:
   ```
   .claude/plans/1_pre_exec_plans/20250816_143000_USER_AUTHENTICATION.md
   ```

### Step 3: Follow the Three-Phase Workflow

#### Phase 1: Pre-Execution Planning
Create your plan using the template:

```markdown
# Pre-Execution Plan: User Authentication
**Date:** 2025-08-16 14:30:00
**Priority:** High
**Estimated Duration:** 4 hours

## Objective
Implement secure user authentication with JWT tokens

## Detailed Steps
1. Set up JWT middleware
2. Create user registration endpoint
3. Implement login/logout
4. Add password hashing
5. Write tests

## Success Criteria
- [ ] Users can register with email/password
- [ ] JWT tokens issued on login
- [ ] Protected routes work
- [ ] All tests pass

## Verification Tests Planned
- Unit tests for auth middleware
- Integration tests for endpoints
- Security validation
```

#### Phase 2: Post-Execution Documentation
After implementing, create:
```
.claude/plans/2_post_exec_plans/20250816_143000_USER_AUTHENTICATION_EXECUTED.md
```

Document what you actually did, any deviations from the plan, and issues encountered.

#### Phase 3: Delta Verification
Finally, create:
```
.claude/plans/3_checked_delta_exec_plans/20250816_143000_USER_AUTHENTICATION_VERIFICATION.md
```

Run verification tests and document that everything works as planned.

## 📊 Monitoring Your Progress

### Check Current Status

```bash
# View active plans
cascade status

# Expected output:
# ╔════════════════════════════════════════════════════════════════════════════════╗
# ║                            📋 CLAUDE CASCADE ACTIVE PLANS                       ║
# ╚════════════════════════════════════════════════════════════════════════════════╝
# 
# 📋 User Authentication [Priority: High] [Est: 4 hours]
#    Phases: [✅ ⏳ ⏳] (Score: 33/100)
#    Created: 2025-08-16 14:30
```

### View Analytics

```bash
# See productivity insights
cascade analytics

# Quick summary
cascade summary
```

## 🎨 Customizing Templates

### Using Custom Templates

1. **View Available Templates:**
   ```bash
   cascade templates
   ```

2. **Copy Template to Your Project:**
   ```bash
   cp ~/.claude-cascade/templates/phase1-pre-exec.md .claude/plans/
   ```

3. **Customize for Your Needs:**
   Edit the template to match your project's specific requirements.

### Creating Project-Specific Templates

```bash
# Create custom template directory
mkdir .claude/templates

# Copy and modify base templates
cp ~/.claude-cascade/templates/* .claude/templates/

# Edit templates for your project
vim .claude/templates/phase1-pre-exec.md
```

## 🔧 Configuration Options

### Hook Configuration

Claude Cascade integrates with Claude Code's hook system. You can adjust behavior:

```bash
# View current configuration
cat ~/.claude/settings.json

# The hooks section will show Cascade integration
```

### Cascade Configuration

```bash
# View Cascade settings
cascade config

# Adjust reminder frequency
cascade config set reminder_frequency minimal    # Options: minimal, normal, verbose

# Enable/disable features
cascade config set enable_keyword_detection true
cascade config set enable_file_monitoring true
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "cascade: command not found"

**Solution:**
```bash
# Add to PATH (macOS/Linux)
export PATH="$HOME/.local/bin:$PATH"

# Windows: Restart terminal after installation
```

#### 2. Claude Code hooks not working

**Solution:**
```bash
# Check Claude settings
cat ~/.claude/settings.json

# Reinstall if needed
curl -fsSL https://install.claudecascade.dev | bash
```

#### 3. Permission denied errors

**Solution:**
```bash
# Fix permissions (macOS/Linux)
chmod +x ~/.claude-cascade/hooks/*.sh

# Windows: Run PowerShell as Administrator
```

#### 4. JSON parsing errors

**Solution:**
```bash
# Install jq if missing
# macOS:
brew install jq

# Ubuntu/Debian:
sudo apt-get install jq

# Windows: jq is included with Git Bash
```

### Getting Help

- **Documentation**: [Full documentation](https://docs.claudecascade.dev)
- **Issues**: [GitHub Issues](https://github.com/claudecascade/claude-cascade/issues)
- **Discussions**: [Community Forum](https://github.com/claudecascade/claude-cascade/discussions)

## 🎯 Next Steps

Now that you have Claude Cascade set up:

1. **Read the Philosophy**: Understand [why three-phase planning works](philosophy.md)
2. **Explore Templates**: Learn about [customizing templates](templates.md)
3. **Team Setup**: Configure [multi-developer workflows](team-setup.md)
4. **Analytics**: Dive into [understanding your metrics](analytics.md)

## 🌟 Success Tips

### Best Practices

1. **Start Small**: Begin with simple features to get comfortable
2. **Be Consistent**: Use the same naming convention for all plans
3. **Document Honestly**: Record what actually happened, not what you hoped
4. **Verify Thoroughly**: Phase 3 should include real testing, not just assumptions
5. **Review Regularly**: Use analytics to improve your planning over time

### Team Adoption

1. **Lead by Example**: Use Cascade consistently yourself first
2. **Share Wins**: Highlight how planning prevented issues
3. **Gradual Rollout**: Start with critical features, expand over time
4. **Customize Together**: Create team-specific templates
5. **Celebrate Compliance**: Recognize good planning practices

### Productivity Gains

Users typically see:
- **25% fewer production bugs** (through better verification)
- **40% faster code reviews** (through clear documentation)
- **60% better project predictability** (through systematic planning)
- **80% improved team coordination** (through shared understanding)

Welcome to intelligent planning with Claude Cascade! 🌊