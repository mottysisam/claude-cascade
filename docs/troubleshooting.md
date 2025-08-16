# 🔧 Troubleshooting Guide for Claude Cascade

*Quick solutions to common issues and problems*

## 🚨 Quick Diagnostic Commands

Before diving into specific issues, run these commands to gather information:

```bash
# Check Cascade installation and version
cascade version

# Verify Claude Code integration
cat ~/.claude/settings.json | jq '.hooks'

# Check hook script permissions
ls -la ~/.claude-cascade/hooks/

# Test hook functionality
echo "test planning keywords" | ~/.claude-cascade/hooks/plan-monitor.sh prompt-check

# View recent activity logs
tail -n 50 ~/.claude-cascade/state/plan_history.log
```

## 🛠️ Installation Issues

### Problem: "cascade: command not found"

**Symptoms**:
```bash
$ cascade version
bash: cascade: command not found
```

**Solutions**:

**macOS/Linux**:
```bash
# Check if cascade binary exists
ls -la ~/.local/bin/cascade

# If missing, reinstall
curl -fsSL https://install.claudecascade.dev | bash

# Add to PATH manually
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Or create symlink manually
ln -s ~/.claude-cascade/bin/cascade ~/.local/bin/cascade
```

**Windows**:
```powershell
# Check if cascade exists
Get-Command cascade -ErrorAction SilentlyContinue

# If missing, reinstall
irm https://install.claudecascade.dev/install.ps1 | iex

# Check PATH
$env:PATH -split ';' | Select-String cascade

# Add to PATH manually
$newPath = "$env:USERPROFILE\.claude-cascade\bin"
[Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$newPath", "User")
```

### Problem: Permission denied errors during installation

**Symptoms**:
```bash
./install.sh: Permission denied
mkdir: cannot create directory: Permission denied
```

**Solutions**:

**macOS/Linux**:
```bash
# Fix installer permissions
chmod +x install.sh
./install.sh

# Install with different user permissions
sudo ./install.sh

# Install to user directory only
./install.sh --user-only

# Fix existing installation permissions
chmod +x ~/.claude-cascade/hooks/*.sh
chmod +x ~/.claude-cascade/bin/cascade
```

**Windows**:
```powershell
# Run PowerShell as Administrator
# Right-click PowerShell → "Run as Administrator"

# Fix execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Re-run installer
irm https://install.claudecascade.dev/install.ps1 | iex
```

### Problem: Missing dependencies (jq, bc)

**Symptoms**:
```bash
jq: command not found
bc: command not found
hooks not working properly
```

**Solutions**:

**macOS with Homebrew**:
```bash
brew install jq bc
```

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install jq bc
```

**CentOS/RHEL**:
```bash
sudo yum install jq bc
# or on newer versions:
sudo dnf install jq bc
```

**Windows**:
```bash
# Using Git Bash (recommended)
# jq and bc are included with Git for Windows

# Using Chocolatey
choco install jq
# bc equivalent available in Git Bash
```

**Manual jq installation**:
```bash
# Download jq binary
curl -L https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 -o /usr/local/bin/jq
chmod +x /usr/local/bin/jq
```

## 🔗 Claude Code Integration Issues

### Problem: Hooks not triggering

**Symptoms**:
- No planning reminders when using planning keywords
- No guidance when creating files or running commands
- Claude Code works but Cascade seems inactive

**Diagnostic Steps**:
```bash
# Check Claude settings
cat ~/.claude/settings.json | jq '.hooks' | head -20

# Verify hook script permissions
ls -la ~/.claude-cascade/hooks/

# Test hook manually
echo '{"prompt": "I need to implement user authentication"}' | \
  ~/.claude-cascade/hooks/plan-monitor.sh prompt-check

# Check Claude Code version
claude --version
```

**Solutions**:

**Re-install hook integration**:
```bash
# Backup current settings
cp ~/.claude/settings.json ~/.claude/settings.json.backup

# Re-run installer to fix hooks
curl -fsSL https://install.claudecascade.dev | bash

# Verify hooks are installed
grep -A 10 "claude-cascade" ~/.claude/settings.json
```

**Manual hook configuration**:
```bash
# Edit Claude settings manually
vim ~/.claude/settings.json

# Add this to the hooks section:
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "/Users/[username]/.claude-cascade/hooks/plan-monitor.sh prompt-check"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit|Bash",
      "hooks": [{
        "type": "command",
        "command": "/Users/[username]/.claude-cascade/hooks/phase-validator.sh post-execution"
      }]
    }]
  }
}
```

**Fix hook script permissions**:
```bash
chmod +x ~/.claude-cascade/hooks/*.sh
```

### Problem: JSON parsing errors in Claude settings

**Symptoms**:
```bash
parse error: Invalid numeric literal at line X column Y
Claude Code fails to start
Settings.json validation errors
```

**Solutions**:

**Validate JSON syntax**:
```bash
# Check JSON validity
jq empty ~/.claude/settings.json

# If error, show line with issue
cat -n ~/.claude/settings.json | head -20
```

**Restore from backup**:
```bash
# Restore previous working settings
cp ~/.claude/settings.json.backup ~/.claude/settings.json

# Or create minimal working settings
cat > ~/.claude/settings.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash", "Read", "Edit", "Write", "WebFetch", "Grep", "Glob", "LS",
      "MultiEdit", "NotebookRead", "NotebookEdit", "TodoRead", "TodoWrite", "WebSearch"
    ]
  }
}
EOF
```

**Fix common JSON issues**:
```bash
# Remove trailing commas
sed -i 's/,\s*}/}/g' ~/.claude/settings.json
sed -i 's/,\s*]/]/g' ~/.claude/settings.json

# Validate and pretty-print
jq . ~/.claude/settings.json > ~/.claude/settings.json.tmp
mv ~/.claude/settings.json.tmp ~/.claude/settings.json
```

## 📁 File System and Permissions Issues

### Problem: Cannot create .claude directory

**Symptoms**:
```bash
mkdir: cannot create directory '.claude': Permission denied
cascade init fails
Plans not being saved
```

**Solutions**:

**Check directory permissions**:
```bash
# Check current directory permissions
ls -la

# Check if .claude exists but with wrong permissions
ls -la .claude/

# Fix permissions
chmod 755 .claude/
chmod -R 644 .claude/plans/
chmod 755 .claude/plans/*/
```

**Create directory manually**:
```bash
# Create structure manually
mkdir -p .claude/plans/{1_pre_exec_plans,2_post_exec_plans,3_checked_delta_exec_plans}

# Set correct permissions
chmod 755 .claude .claude/plans .claude/plans/*
```

**Check disk space**:
```bash
# Check available disk space
df -h .

# Check inode availability
df -i .
```

### Problem: Plans not being detected

**Symptoms**:
- `cascade status` shows no plans
- Analytics show zero workflows
- Hook system seems to work but doesn't find plans

**Diagnostic Steps**:
```bash
# Check plan directory structure
find .claude/plans -name "*.md" -type f

# Check file naming convention
ls -la .claude/plans/1_pre_exec_plans/

# Verify plan file format
head -5 .claude/plans/1_pre_exec_plans/*.md
```

**Solutions**:

**Fix naming convention**:
```bash
# Plans must follow: YYYYMMDD_HHMMSS_DESCRIPTIVE_NAME.md
# Correct examples:
20250816_143000_USER_AUTHENTICATION.md
20250816_150000_DATABASE_MIGRATION.md

# Rename incorrectly named files
mv .claude/plans/1_pre_exec_plans/user-auth.md \
   .claude/plans/1_pre_exec_plans/20250816_143000_USER_AUTHENTICATION.md
```

**Check environment variables**:
```bash
# Verify CLAUDE_PROJECT_DIR if set
echo $CLAUDE_PROJECT_DIR

# Unset if causing issues
unset CLAUDE_PROJECT_DIR

# Or set to current project
export CLAUDE_PROJECT_DIR=$(pwd)
```

**Rebuild plan index**:
```bash
# Force refresh of plan detection
cascade refresh --rebuild-index

# Check state files
ls -la ~/.claude-cascade/state/
cat ~/.claude-cascade/state/active_plans.json
```

## 🐛 Hook System Issues

### Problem: Hooks causing Claude Code to hang

**Symptoms**:
- Claude Code becomes unresponsive
- Long delays before commands complete
- Timeout errors in terminal

**Solutions**:

**Check hook script timeouts**:
```bash
# Test hook execution time
time echo "test" | ~/.claude-cascade/hooks/plan-monitor.sh prompt-check

# Should complete in <1 second
```

**Disable problematic hooks temporarily**:
```bash
# Backup settings
cp ~/.claude/settings.json ~/.claude/settings.json.backup

# Remove hooks temporarily
jq 'del(.hooks)' ~/.claude/settings.json > ~/.claude/settings.json.tmp
mv ~/.claude/settings.json.tmp ~/.claude/settings.json

# Test Claude Code without hooks
claude

# Re-enable one hook at a time to identify issue
```

**Fix infinite loops in hooks**:
```bash
# Check for infinite loops in hook scripts
grep -n "while\|for\|until" ~/.claude-cascade/hooks/*.sh

# Add timeout to hook commands
timeout 5s ~/.claude-cascade/hooks/plan-monitor.sh prompt-check
```

### Problem: Hooks producing too much output

**Symptoms**:
- Verbose output cluttering Claude Code interface
- Performance degradation
- Log files growing very large

**Solutions**:

**Adjust logging levels**:
```bash
# Configure less verbose logging
cascade config set log_level 2  # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR

# Disable specific hook features
cascade config set enable_keyword_detection false
cascade config set reminder_frequency minimal
```

**Clean up log files**:
```bash
# Rotate log files
mv ~/.claude-cascade/state/plan_history.log ~/.claude-cascade/state/plan_history.log.old
touch ~/.claude-cascade/state/plan_history.log

# Set up log rotation
echo "0 0 * * 0 /usr/bin/logrotate ~/.claude-cascade/logrotate.conf" | crontab -

# Create logrotate config
cat > ~/.claude-cascade/logrotate.conf << 'EOF'
~/.claude-cascade/state/*.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
EOF
```

## 📊 Analytics and CLI Issues

### Problem: Analytics showing incorrect data

**Symptoms**:
- Completion rates don't match reality
- Missing workflows in analytics
- Time calculations seem wrong

**Diagnostic Steps**:
```bash
# Check state file contents
cat ~/.claude-cascade/state/compliance_stats.json | jq .

# Verify plan files are being detected
cascade status --verbose

# Check date calculations
cascade analytics --debug
```

**Solutions**:

**Rebuild analytics data**:
```bash
# Clear analytics cache
rm ~/.claude-cascade/state/compliance_stats.json
rm ~/.claude-cascade/state/analytics.json

# Regenerate analytics
cascade analytics --rebuild

# Verify results
cascade analytics 7
```

**Fix date parsing issues**:
```bash
# Check system date format
date
date +%Y%m%d_%H%M%S

# Verify plan file naming matches expected format
ls .claude/plans/1_pre_exec_plans/ | head -5
```

**Manual analytics calculation**:
```bash
# Count files manually to verify
echo "Phase 1 plans today: $(find .claude/plans/1_pre_exec_plans -name "$(date +%Y%m%d)_*.md" | wc -l)"
echo "Phase 2 plans today: $(find .claude/plans/2_post_exec_plans -name "$(date +%Y%m%d)_*.md" | wc -l)"
echo "Phase 3 plans today: $(find .claude/plans/3_checked_delta_exec_plans -name "$(date +%Y%m%d)_*.md" | wc -l)"
```

### Problem: CLI commands failing

**Symptoms**:
```bash
cascade: line 42: unexpected token
cascade analytics: command not found
JSON parsing errors in CLI output
```

**Solutions**:

**Check shell compatibility**:
```bash
# Verify shell version
echo $SHELL
$SHELL --version

# Test with bash explicitly
bash ~/.claude-cascade/bin/cascade version

# Fix shebang if needed
head -1 ~/.claude-cascade/bin/cascade
# Should be: #!/bin/bash
```

**Reinstall CLI components**:
```bash
# Re-download and install CLI
curl -fsSL https://install.claudecascade.dev | bash

# Or build from source
git clone https://github.com/claudecascade/claude-cascade.git
cd claude-cascade
./scripts/build-cli.sh
```

**Check environment variables**:
```bash
# Required environment variables
echo "HOME: $HOME"
echo "PATH: $PATH"
echo "SHELL: $SHELL"

# Cascade-specific variables
echo "CLAUDE_PROJECT_DIR: $CLAUDE_PROJECT_DIR"
```

## 🔄 Integration Issues

### Problem: Git integration not working

**Symptoms**:
- Pre-commit hooks not triggering
- Plans not being committed properly
- Git status shows unexpected files

**Solutions**:

**Check git hooks installation**:
```bash
# Verify git hooks
ls -la .git/hooks/

# Install Cascade git hooks
cascade git install-hooks

# Test pre-commit hook
git add .
git commit -m "test commit"
```

**Fix git ignore settings**:
```bash
# Add appropriate .gitignore entries
echo ".cascade-cache/" >> .gitignore
echo "*.cascade.tmp" >> .gitignore

# Don't ignore plan files (they should be committed)
# Remove if present:
# .claude/
```

### Problem: Slack/webhook integration fails

**Symptoms**:
- No notifications in Slack
- Webhook timeout errors
- Integration commands fail

**Solutions**:

**Test webhook manually**:
```bash
# Test webhook URL
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from Claude Cascade"}' \
  YOUR_WEBHOOK_URL

# Check webhook configuration
cascade config get slack_webhook_url
```

**Debug webhook issues**:
```bash
# Enable webhook debugging
cascade config set webhook_debug true

# Check webhook logs
tail -f ~/.claude-cascade/state/webhook.log

# Test with simple payload
cascade notifications test --webhook YOUR_WEBHOOK_URL
```

## 🚨 Emergency Recovery

### Complete Cascade Reset

If Cascade is completely broken and you need to start fresh:

```bash
# Backup current configuration
mkdir ~/cascade-backup
cp -r ~/.claude-cascade ~/cascade-backup/
cp ~/.claude/settings.json ~/cascade-backup/

# Complete uninstall
rm -rf ~/.claude-cascade
# Remove Cascade sections from ~/.claude/settings.json manually

# Fresh install
curl -fsSL https://install.claudecascade.dev | bash

# Restore plan files if needed
cp -r ~/cascade-backup/.claude-cascade/state/*.json ~/.claude-cascade/state/
```

### Recover Corrupted Plan Files

```bash
# Find corrupted plan files
find .claude/plans -name "*.md" -exec file {} \; | grep -v "UTF-8"

# Recover from git if available
git checkout HEAD -- .claude/plans/

# Recreate minimal plan structure
mkdir -p .claude/plans/{1_pre_exec_plans,2_post_exec_plans,3_checked_delta_exec_plans}
```

### Claude Code Won't Start After Cascade Installation

```bash
# Restore original Claude settings
cp ~/.claude/settings.json.backup ~/.claude/settings.json

# Or create minimal settings
cat > ~/.claude/settings.json << 'EOF'
{
  "permissions": {
    "allow": ["Bash", "Read", "Edit", "Write", "WebFetch", "Grep", "Glob", "LS"]
  }
}
EOF

# Test Claude Code startup
claude --version

# Re-add Cascade hooks after confirming Claude works
```

## 🔍 Getting Help

### Collecting Diagnostic Information

When reporting issues, include this information:

```bash
# System information
uname -a
echo "Shell: $SHELL"
echo "Claude Code version: $(claude --version 2>/dev/null || echo 'Not installed')"

# Cascade information
cascade version
cascade config
ls -la ~/.claude-cascade/

# Error logs
tail -50 ~/.claude-cascade/state/plan_history.log
tail -20 ~/.claude-cascade/state/validation.log

# File permissions
ls -la ~/.claude/
ls -la ~/.claude-cascade/hooks/

# Plan files sample
find .claude/plans -name "*.md" | head -5
```

### Where to Get Help

1. **Documentation**: [Full docs](https://docs.claudecascade.dev)
2. **GitHub Issues**: [Report bugs](https://github.com/claudecascade/claude-cascade/issues)
3. **Community Forum**: [Get help](https://github.com/claudecascade/claude-cascade/discussions)
4. **Slack/Discord**: [Community chat](https://discord.gg/claudecascade)

### Creating Effective Bug Reports

**Include**:
- Exact error messages
- Steps to reproduce
- Expected vs. actual behavior
- System information
- Relevant log excerpts

**Template**:
```markdown
## Bug Report

**Environment**:
- OS: [macOS 12.0 / Ubuntu 20.04 / Windows 11]
- Shell: [bash 5.1 / zsh 5.8 / PowerShell 7.2]
- Claude Code version: [output of `claude --version`]
- Cascade version: [output of `cascade version`]

**Issue**:
[Clear description of the problem]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Error Messages**:
```
[Paste exact error messages here]
```

**Additional Context**:
[Any other relevant information]
```

## 💡 Prevention Tips

### Regular Maintenance

```bash
# Weekly health check
cascade doctor

# Monthly cleanup
cascade cleanup --older-than 30days

# Quarterly update
cascade update --check
```

### Best Practices

1. **Keep Cascade Updated**: Regular updates fix bugs and add features
2. **Monitor Disk Space**: Plan files and logs can accumulate
3. **Backup Configuration**: Keep copies of working configurations
4. **Test Before Team Rollout**: Validate changes in safe environment
5. **Document Team Customizations**: Track local modifications

### Common Pitfalls to Avoid

❌ **Don't modify hook scripts directly** - Use configuration options instead
❌ **Don't ignore permission errors** - Fix permissions properly
❌ **Don't skip backups** - Always backup before major changes
❌ **Don't use spaces in plan filenames** - Use underscores instead
❌ **Don't commit sensitive data** - Review plan contents before committing

## 🎯 Conclusion

Most Cascade issues are straightforward to resolve with systematic troubleshooting:

1. **Gather information** using diagnostic commands
2. **Identify the root cause** through process of elimination
3. **Apply targeted solutions** rather than wholesale changes
4. **Verify the fix** with test cases
5. **Document the solution** for future reference

Remember: The Cascade community is here to help! Don't hesitate to reach out when you encounter issues.

---

*Having a problem not covered here? [Create an issue](https://github.com/claudecascade/claude-cascade/issues) and help us improve this guide.*