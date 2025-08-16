#!/bin/bash
# Claude Cascade - Intelligent Planning Workflows for Claude Code
# One-Click Installation Script for macOS and Linux
# https://github.com/claudecascade/claude-cascade

set -euo pipefail

# Script metadata
readonly SCRIPT_VERSION="1.0.0"
readonly CASCADE_VERSION="1.0.0"
readonly SCRIPT_NAME="Claude Cascade Installer"

# Colors for enhanced output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Installation paths
readonly CLAUDE_DIR="$HOME/.claude"
readonly CASCADE_DIR="$HOME/.claude-cascade"
readonly HOOKS_DIR="$CASCADE_DIR/hooks"
readonly STATE_DIR="$CASCADE_DIR/state"
readonly BACKUP_DIR="$CASCADE_DIR/backup/$(date +%Y%m%d_%H%M%S)"

# Configuration files
readonly CLAUDE_SETTINGS="$CLAUDE_DIR/settings.json"
readonly CLAUDE_MD="$CLAUDE_DIR/CLAUDE.md"

# Logging
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${CYAN}[$timestamp]${NC} ${message}" ;;
        "SUCCESS") echo -e "${GREEN}[$timestamp]${NC} ✅ ${message}" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp]${NC} ⚠️  ${message}" ;;
        "ERROR") echo -e "${RED}[$timestamp]${NC} ❌ ${message}" ;;
        "STEP")  echo -e "${BLUE}[$timestamp]${NC} 🔧 ${message}" ;;
    esac
}

# Display banner
show_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                                ║${NC}"
    echo -e "${CYAN}║                      🌊 ${BOLD}CLAUDE CASCADE INSTALLER${NC}${CYAN} 🌊                        ║${NC}"
    echo -e "${CYAN}║                                                                                ║${NC}"
    echo -e "${CYAN}║                 Intelligent Planning Workflows for Claude Code                ║${NC}"
    echo -e "${CYAN}║                                v$CASCADE_VERSION                                    ║${NC}"
    echo -e "${CYAN}║                                                                                ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}This installer will set up Claude Cascade's three-phase planning workflow system.${NC}"
    echo ""
}

# Check system requirements
check_requirements() {
    log "STEP" "Checking system requirements..."
    
    # Check for required commands
    local required_commands=("jq" "bc" "find" "grep" "sed")
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_commands+=("$cmd")
        fi
    done
    
    # Check for Claude Code
    if ! command -v "claude" >/dev/null 2>&1; then
        log "WARN" "Claude Code CLI not found in PATH. This installer works best with Claude Code installed."
        echo -e "${YELLOW}   You can install Claude Code from: https://claude.ai/code${NC}"
        echo ""
    else
        log "SUCCESS" "Claude Code CLI detected"
    fi
    
    # Handle missing commands
    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        log "WARN" "Missing required commands: ${missing_commands[*]}"
        
        # Offer to install missing commands
        case "$(uname -s)" in
            "Darwin")
                if command -v "brew" >/dev/null 2>&1; then
                    echo -e "${BLUE}Would you like to install missing commands using Homebrew? [y/N]${NC}"
                    read -r response
                    if [[ "$response" =~ ^[Yy]$ ]]; then
                        for cmd in "${missing_commands[@]}"; do
                            case "$cmd" in
                                "jq") brew install jq ;;
                                "bc") brew install bc ;;
                            esac
                        done
                    fi
                else
                    echo -e "${YELLOW}Please install: ${missing_commands[*]}${NC}"
                    echo -e "${YELLOW}On macOS with Homebrew: brew install jq bc${NC}"
                fi
                ;;
            "Linux")
                echo -e "${YELLOW}Please install missing commands:${NC}"
                echo -e "${YELLOW}On Ubuntu/Debian: sudo apt-get install ${missing_commands[*]}${NC}"
                echo -e "${YELLOW}On CentOS/RHEL: sudo yum install ${missing_commands[*]}${NC}"
                ;;
        esac
        
        # Re-check after potential installation
        local still_missing=()
        for cmd in "${missing_commands[@]}"; do
            if ! command -v "$cmd" >/dev/null 2>&1; then
                still_missing+=("$cmd")
            fi
        done
        
        if [[ ${#still_missing[@]} -gt 0 ]]; then
            log "ERROR" "Still missing: ${still_missing[*]}. Installation may not work correctly."
            echo -e "${RED}Please install these commands and run the installer again.${NC}"
            exit 1
        fi
    fi
    
    log "SUCCESS" "System requirements satisfied"
}

# Backup existing configuration
backup_existing_config() {
    log "STEP" "Creating backup of existing configuration..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup Claude settings if they exist
    if [[ -f "$CLAUDE_SETTINGS" ]]; then
        cp "$CLAUDE_SETTINGS" "$BACKUP_DIR/settings.json.backup"
        log "SUCCESS" "Backed up existing Claude settings"
    fi
    
    # Backup CLAUDE.md if it exists
    if [[ -f "$CLAUDE_MD" ]]; then
        cp "$CLAUDE_MD" "$BACKUP_DIR/CLAUDE.md.backup"
        log "SUCCESS" "Backed up existing CLAUDE.md"
    fi
    
    # Backup any existing cascade configuration
    if [[ -d "$CASCADE_DIR" ]]; then
        cp -r "$CASCADE_DIR" "$BACKUP_DIR/cascade-old/"
        log "SUCCESS" "Backed up existing Claude Cascade installation"
    fi
    
    log "SUCCESS" "Backup completed: $BACKUP_DIR"
}

# Install core hook scripts
install_hooks() {
    log "STEP" "Installing Claude Cascade hook scripts..."
    
    mkdir -p "$HOOKS_DIR" "$STATE_DIR"
    
    # Get the directory where this script is located
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local src_hooks_dir="$script_dir/../src/hooks"
    
    # Copy hook scripts
    if [[ -d "$src_hooks_dir" ]]; then
        cp "$src_hooks_dir"/*.sh "$HOOKS_DIR/"
        chmod +x "$HOOKS_DIR"/*.sh
        log "SUCCESS" "Installed hook scripts to $HOOKS_DIR"
    else
        log "ERROR" "Source hook scripts not found at $src_hooks_dir"
        return 1
    fi
    
    # Initialize state files
    cat > "$STATE_DIR/active_plans.json" << 'EOF'
{
    "active_plans": [],
    "last_updated": "",
    "cascade_version": "1.0.0"
}
EOF
    
    cat > "$STATE_DIR/compliance_stats.json" << 'EOF'
{
    "total_plans": 0,
    "complete_workflows": 0,
    "incomplete_workflows": 0,
    "compliance_rate": 0.0,
    "phase_counts": {"phase1": 0, "phase2": 0, "phase3": 0},
    "last_updated": "",
    "cascade_version": "1.0.0"
}
EOF
    
    touch "$STATE_DIR/plan_history.log"
    touch "$STATE_DIR/validation.log"
    
    log "SUCCESS" "Initialized state management files"
}

# Install plan templates
install_templates() {
    log "STEP" "Installing plan templates..."
    
    local templates_dir="$CASCADE_DIR/templates"
    mkdir -p "$templates_dir"
    
    # Create enhanced Phase 1 template
    cat > "$templates_dir/phase1-pre-exec.md" << 'EOF'
# Pre-Execution Plan: [PLAN_NAME]
**Date:** YYYY-MM-DD HH:MM:SS
**Estimated Duration:** [X hours/days]
**Priority:** [High/Medium/Low]

## Objective
[Clear statement of what needs to be accomplished]

## Detailed Steps
1. [Step 1 with specific actions]
2. [Step 2 with specific actions]
3. [Step 3 with specific actions]
...

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
...

## Resources Required
- [Tools, access, dependencies]

## Risks & Mitigation
- **Risk:** [Description] → **Mitigation:** [Strategy]

## Expected Outcomes
[What should be achieved]

## Files to be Modified/Created
- [List of files that will be changed]

## Commands to Execute
- [List of commands that will be run]

## Verification Tests Planned
- [Tests that will be run in Phase 3 to verify completion]
EOF

    # Create enhanced Phase 2 template
    cat > "$templates_dir/phase2-post-exec.md" << 'EOF'
# Post-Execution Report: [PLAN_NAME]
**Date:** YYYY-MM-DD HH:MM:SS
**Actual Duration:** [X hours/days]
**Status:** [Completed/Partially Completed/Failed]
**Original Plan:** [Reference to Phase 1 file]

## What Was Executed
[Detailed account of actions taken]

## Deviations from Plan
[Any changes made during execution and why]

## Issues Encountered
[Problems faced and how they were resolved]

## Results Achieved
[Actual outcomes vs expected]

## Files Modified/Created
- [Actual list of files changed]

## Commands Executed
- [Actual commands run]

## Lessons Learned
[Insights for future planning]

## Next Steps
[What needs to happen in Phase 3 verification]
EOF

    # Create enhanced Phase 3 template
    cat > "$templates_dir/phase3-verification.md" << 'EOF'
# Delta Verification Report: [PLAN_NAME]
**Date:** YYYY-MM-DD HH:MM:SS
**Verification Status:** [Pass/Fail/Partial]
**Original Plan:** [Reference to Phase 1 file]
**Execution Report:** [Reference to Phase 2 file]

## Pre vs Post Comparison
### Planned vs Executed
- ✅ **Completed:** [List items that were fully completed]
- ⚠️ **Partially Done:** [Items with partial completion]
- ❌ **Not Done:** [Items not completed]

## Verification Tests Performed

### Test 1: [Test Description]
- **Command/Action:** [Specific test performed]
- **Expected Result:** [What should happen]
- **Actual Result:** [What actually happened]
- **Status:** [Pass/Fail]

### Test 2: [Test Description]
- **Command/Action:** [Specific test performed]
- **Expected Result:** [What should happen]
- **Actual Result:** [What actually happened]
- **Status:** [Pass/Fail]

## File System Verification
- [ ] All planned files exist
- [ ] File contents match expectations
- [ ] File permissions are correct
- [ ] Directory structure is as planned

## Service/System Verification
- [ ] Services are running as expected
- [ ] Configuration changes applied correctly
- [ ] Integration points working

## Performance Verification
- [ ] Performance goals met
- [ ] No degradation introduced
- [ ] Resource usage within expected bounds

## Overall Assessment
[Summary of plan execution effectiveness]

## Recommendations
[Improvements for future similar plans]

## Final Status
- **Plan Execution:** [Successful/Failed/Partial]
- **All Tests Passed:** [Yes/No]
- **Ready for Production:** [Yes/No]
EOF

    log "SUCCESS" "Installed plan templates"
}

# Configure Claude Code integration
configure_claude_integration() {
    log "STEP" "Configuring Claude Code integration..."
    
    # Ensure Claude directory exists
    mkdir -p "$CLAUDE_DIR"
    
    # Update settings.json to include hooks
    if [[ -f "$CLAUDE_SETTINGS" ]]; then
        log "INFO" "Updating existing Claude settings.json"
        
        # Create a backup and enhanced settings
        local temp_settings="/tmp/claude_settings_temp.json"
        
        # Check if hooks section exists
        if jq -e '.hooks' "$CLAUDE_SETTINGS" >/dev/null 2>&1; then
            log "INFO" "Existing hooks found, integrating Claude Cascade hooks"
            
            # Add cascade hooks to existing configuration
            jq --arg hooks_dir "$HOOKS_DIR" '
                .hooks.UserPromptSubmit[0].hooks += [{
                    "type": "command",
                    "command": ($hooks_dir + "/plan-monitor.sh prompt-check")
                }] |
                .hooks.Stop[0].hooks += [{
                    "type": "command", 
                    "command": ($hooks_dir + "/plan-tracker.sh final-check")
                }] |
                .hooks.PreToolUse += [
                    {
                        "matcher": "Write|Edit|MultiEdit",
                        "hooks": [{
                            "type": "command",
                            "command": ($hooks_dir + "/plan-monitor.sh pre-write-check")
                        }]
                    },
                    {
                        "matcher": "Bash",
                        "hooks": [{
                            "type": "command",
                            "command": ($hooks_dir + "/plan-monitor.sh pre-bash-check")
                        }]
                    }
                ] |
                .hooks.PostToolUse += [{
                    "matcher": "Write|Edit|MultiEdit|Bash",
                    "hooks": [{
                        "type": "command",
                        "command": ($hooks_dir + "/phase-validator.sh post-execution")
                    }]
                }]
            ' "$CLAUDE_SETTINGS" > "$temp_settings"
        else
            log "INFO" "No existing hooks found, creating new hooks configuration"
            
            # Add complete hooks configuration
            jq --arg hooks_dir "$HOOKS_DIR" '
                .hooks = {
                    "UserPromptSubmit": [{
                        "hooks": [{
                            "type": "command",
                            "command": ($hooks_dir + "/plan-monitor.sh prompt-check")
                        }]
                    }],
                    "Stop": [{
                        "hooks": [{
                            "type": "command",
                            "command": ($hooks_dir + "/plan-tracker.sh final-check")
                        }]
                    }],
                    "PreToolUse": [
                        {
                            "matcher": "Write|Edit|MultiEdit",
                            "hooks": [{
                                "type": "command",
                                "command": ($hooks_dir + "/plan-monitor.sh pre-write-check")
                            }]
                        },
                        {
                            "matcher": "Bash",
                            "hooks": [{
                                "type": "command",
                                "command": ($hooks_dir + "/plan-monitor.sh pre-bash-check")
                            }]
                        }
                    ],
                    "PostToolUse": [{
                        "matcher": "Write|Edit|MultiEdit|Bash",
                        "hooks": [{
                            "type": "command",
                            "command": ($hooks_dir + "/phase-validator.sh post-execution")
                        }]
                    }]
                }
            ' "$CLAUDE_SETTINGS" > "$temp_settings"
        fi
        
        # Validate the JSON and apply changes
        if jq empty "$temp_settings" 2>/dev/null; then
            mv "$temp_settings" "$CLAUDE_SETTINGS"
            log "SUCCESS" "Updated Claude settings.json with Cascade hooks"
        else
            log "ERROR" "Failed to create valid settings.json"
            rm -f "$temp_settings"
            return 1
        fi
    else
        log "INFO" "Creating new Claude settings.json"
        
        # Create new settings file with hooks
        cat > "$CLAUDE_SETTINGS" << EOF
{
    "permissions": {
        "allow": [
            "Bash", "Read", "Edit", "Write", "WebFetch", "Grep", "Glob", "LS",
            "MultiEdit", "NotebookRead", "NotebookEdit", "TodoRead", "TodoWrite", "WebSearch"
        ]
    },
    "hooks": {
        "UserPromptSubmit": [{
            "hooks": [{
                "type": "command",
                "command": "$HOOKS_DIR/plan-monitor.sh prompt-check"
            }]
        }],
        "Stop": [{
            "hooks": [{
                "type": "command",
                "command": "$HOOKS_DIR/plan-tracker.sh final-check"
            }]
        }],
        "PreToolUse": [
            {
                "matcher": "Write|Edit|MultiEdit",
                "hooks": [{
                    "type": "command",
                    "command": "$HOOKS_DIR/plan-monitor.sh pre-write-check"
                }]
            },
            {
                "matcher": "Bash",
                "hooks": [{
                    "type": "command",
                    "command": "$HOOKS_DIR/plan-monitor.sh pre-bash-check"
                }]
            }
        ],
        "PostToolUse": [{
            "matcher": "Write|Edit|MultiEdit|Bash",
            "hooks": [{
                "type": "command",
                "command": "$HOOKS_DIR/phase-validator.sh post-execution"
            }]
        }]
    }
}
EOF
        log "SUCCESS" "Created new Claude settings.json with Cascade hooks"
    fi
    
    # Update or create CLAUDE.md
    log "INFO" "Configuring CLAUDE.md with Cascade workflow"
    
    local planning_section='## Planning - Claude Cascade Integration
- **Phase 1 - Pre-Execution Plans**: When suggesting ANY plan, **ALWAYS** immediately save it to `.claude/plans/1_pre_exec_plans/` with format: `YYYYMMDD_HHMMSS_DESCRIPTIVE_NAME.md`
- **Phase 2 - Post-Execution Plans**: After plan execution, document what was actually done in `.claude/plans/2_post_exec_plans/` using same naming format with `_EXECUTED` suffix
- **Phase 3 - Delta Verification**: Compare pre vs post execution, run verification tests, and document findings in `.claude/plans/3_checked_delta_exec_plans/` with `_VERIFICATION` suffix
- **Critical Rule**: NEVER suggest a plan without immediately saving it to phase 1 directory
- **Verification Requirement**: Phase 3 must include actual tests/checks to verify completion, not just documentation review
- **Claude Cascade**: Intelligent planning workflows automatically monitored and guided by hooks'
    
    if [[ -f "$CLAUDE_MD" ]]; then
        # Update existing CLAUDE.md
        if grep -q "## Planning" "$CLAUDE_MD"; then
            # Replace existing planning section
            sed -i.backup '/## Planning/,/^## /{/^## Planning/!{/^## /!d}}' "$CLAUDE_MD"
            sed -i.backup '/## Planning/r /dev/stdin' "$CLAUDE_MD" <<< "$planning_section"
        else
            # Add planning section at the beginning
            echo -e "$planning_section\n\n$(cat "$CLAUDE_MD")" > "$CLAUDE_MD"
        fi
        log "SUCCESS" "Updated existing CLAUDE.md with Cascade workflow"
    else
        # Create new CLAUDE.md
        cat > "$CLAUDE_MD" << EOF
# CLAUDE.md – Universal Project AI Agent & Engineering Protocol

This document defines engineering practices, code structure, and Claude Code agent responsibilities for this project.

$planning_section

## Enhanced by Claude Cascade
This project uses Claude Cascade for intelligent planning workflows. For more information:
- Repository: https://github.com/claudecascade/claude-cascade
- Documentation: https://claudecascade.dev
- Templates: $CASCADE_DIR/templates/

EOF
        log "SUCCESS" "Created new CLAUDE.md with Cascade workflow"
    fi
}

# Create CLI command
install_cli() {
    log "STEP" "Installing 'cascade' CLI command..."
    
    # Create CLI script
    local cli_script="$CASCADE_DIR/bin/cascade"
    mkdir -p "$(dirname "$cli_script")"
    
    cat > "$cli_script" << 'EOF'
#!/bin/bash
# Claude Cascade CLI Tool
# https://github.com/claudecascade/claude-cascade

set -euo pipefail

HOOKS_DIR="$HOME/.claude-cascade/hooks"
STATE_DIR="$HOME/.claude-cascade/state"

show_help() {
    cat << 'HELP'
Claude Cascade CLI - Intelligent Planning Workflows for Claude Code

USAGE:
    cascade <command> [options]

COMMANDS:
    init                Initialize Cascade in current project
    status              Show current plans and compliance
    list                List active plans with details
    report              Generate compliance report
    analytics [days]    Show analytics for last N days (default: 7)
    summary             Quick summary of today's workflows
    templates           Manage plan templates
    config              View/edit configuration
    help                Show this help message
    version             Show version information

EXAMPLES:
    cascade status              # Show today's plan status
    cascade list                # List all active plans
    cascade analytics 14        # Show 14-day analytics
    cascade report              # Generate detailed report

For more information: https://github.com/claudecascade/claude-cascade
HELP
}

show_version() {
    echo "Claude Cascade CLI v1.0.0"
    echo "Intelligent planning workflows for Claude Code"
    echo "https://github.com/claudecascade/claude-cascade"
}

case "${1:-help}" in
    "init")
        echo "🌊 Initializing Claude Cascade in current project..."
        mkdir -p .claude/plans/{1_pre_exec_plans,2_post_exec_plans,3_checked_delta_exec_plans}
        echo "✅ Directory structure created"
        echo "📋 Templates available in: $HOME/.claude-cascade/templates/"
        ;;
    "status"|"list")
        export CLAUDE_PROJECT_DIR="$(pwd)"
        "$HOOKS_DIR/plan-tracker.sh" list-active
        ;;
    "report"|"analytics")
        export CLAUDE_PROJECT_DIR="$(pwd)"
        "$HOOKS_DIR/plan-tracker.sh" analytics "${2:-7}"
        ;;
    "summary")
        export CLAUDE_PROJECT_DIR="$(pwd)"
        "$HOOKS_DIR/plan-tracker.sh" summary
        ;;
    "templates")
        echo "📁 Claude Cascade Templates:"
        echo "=============================="
        ls -la "$HOME/.claude-cascade/templates/"
        echo ""
        echo "💡 Copy templates to your project:"
        echo "   cp \$HOME/.claude-cascade/templates/* .claude/plans/"
        ;;
    "config")
        echo "⚙️  Claude Cascade Configuration:"
        echo "================================="
        echo "Hooks directory: $HOOKS_DIR"
        echo "State directory: $STATE_DIR"
        echo "Templates: $HOME/.claude-cascade/templates/"
        echo "Claude settings: $HOME/.claude/settings.json"
        ;;
    "help")
        show_help
        ;;
    "version")
        show_version
        ;;
    *)
        echo "Unknown command: ${1:-}"
        echo "Run 'cascade help' for usage information"
        exit 1
        ;;
esac
EOF
    
    chmod +x "$cli_script"
    
    # Add to PATH by creating symlink
    local bin_dir="$HOME/.local/bin"
    mkdir -p "$bin_dir"
    
    if [[ -L "$bin_dir/cascade" ]]; then
        rm "$bin_dir/cascade"
    fi
    
    ln -s "$cli_script" "$bin_dir/cascade"
    
    log "SUCCESS" "Installed 'cascade' CLI command"
    
    # Check if ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        log "WARN" "Add $HOME/.local/bin to your PATH to use 'cascade' command globally"
        echo -e "${YELLOW}   Add this line to your ~/.bashrc or ~/.zshrc:${NC}"
        echo -e "${YELLOW}   export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
    fi
}

# Verify installation
verify_installation() {
    log "STEP" "Verifying installation..."
    
    local verification_errors=()
    
    # Check if hook scripts exist and are executable
    local hooks=("plan-monitor.sh" "phase-validator.sh" "plan-tracker.sh")
    for hook in "${hooks[@]}"; do
        if [[ ! -x "$HOOKS_DIR/$hook" ]]; then
            verification_errors+=("Hook script not executable: $hook")
        fi
    done
    
    # Check state files
    local state_files=("active_plans.json" "compliance_stats.json")
    for file in "${state_files[@]}"; do
        if [[ ! -f "$STATE_DIR/$file" ]]; then
            verification_errors+=("State file missing: $file")
        fi
    done
    
    # Check Claude settings integration
    if [[ -f "$CLAUDE_SETTINGS" ]]; then
        if ! jq -e '.hooks.UserPromptSubmit[0].hooks[] | select(.command | contains("plan-monitor.sh"))' "$CLAUDE_SETTINGS" >/dev/null 2>&1; then
            verification_errors+=("Claude settings not properly configured")
        fi
    else
        verification_errors+=("Claude settings.json not found")
    fi
    
    # Check CLI command
    if [[ ! -x "$CASCADE_DIR/bin/cascade" ]]; then
        verification_errors+=("CLI command not installed")
    fi
    
    if [[ ${#verification_errors[@]} -gt 0 ]]; then
        log "ERROR" "Installation verification failed:"
        printf '   ❌ %s\n' "${verification_errors[@]}"
        return 1
    else
        log "SUCCESS" "Installation verification passed"
        return 0
    fi
}

# Run a quick test
run_quick_test() {
    log "STEP" "Running quick functionality test..."
    
    # Test hook execution
    export CLAUDE_PROJECT_DIR="/tmp"
    
    # Test plan monitor
    if echo "test" | "$HOOKS_DIR/plan-monitor.sh" prompt-check >/dev/null 2>&1; then
        log "SUCCESS" "Plan monitor hook working"
    else
        log "WARN" "Plan monitor hook test failed"
    fi
    
    # Test plan tracker
    if "$HOOKS_DIR/plan-tracker.sh" summary >/dev/null 2>&1; then
        log "SUCCESS" "Plan tracker hook working"
    else
        log "WARN" "Plan tracker hook test failed"
    fi
    
    # Test CLI
    if command -v cascade >/dev/null 2>&1 && cascade version >/dev/null 2>&1; then
        log "SUCCESS" "CLI command working"
    else
        log "WARN" "CLI command not in PATH or not working"
    fi
}

# Display completion message
show_completion() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                                ║${NC}"
    echo -e "${GREEN}║                    🎉 ${BOLD}CLAUDE CASCADE INSTALLATION COMPLETE!${NC}${GREEN} 🎉                  ║${NC}"
    echo -e "${GREEN}║                                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BLUE}📋 What was installed:${NC}"
    echo -e "   • Hook scripts for intelligent planning workflow monitoring"
    echo -e "   • Plan templates for consistent documentation"
    echo -e "   • 'cascade' CLI tool for project management"
    echo -e "   • Integration with Claude Code settings"
    echo ""
    
    echo -e "${BLUE}🚀 Getting started:${NC}"
    echo -e "   1. Navigate to a project directory"
    echo -e "   2. Run: ${BOLD}cascade init${NC}"
    echo -e "   3. Start using Claude Code - Cascade will guide your planning!"
    echo ""
    
    echo -e "${BLUE}💡 Quick commands:${NC}"
    echo -e "   • ${BOLD}cascade status${NC}    - Show current plans"
    echo -e "   • ${BOLD}cascade analytics${NC} - View productivity insights"
    echo -e "   • ${BOLD}cascade help${NC}      - Full command reference"
    echo ""
    
    echo -e "${BLUE}📚 Learn more:${NC}"
    echo -e "   • Documentation: ${CYAN}https://github.com/claudecascade/claude-cascade${NC}"
    echo -e "   • Templates: ${CYAN}$CASCADE_DIR/templates/${NC}"
    echo -e "   • State files: ${CYAN}$STATE_DIR/${NC}"
    echo ""
    
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo -e "${YELLOW}⚠️  To use the 'cascade' command globally, add this to your shell profile:${NC}"
        echo -e "${YELLOW}   export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
        echo ""
    fi
    
    echo -e "${CYAN}Thank you for installing Claude Cascade! 🌊${NC}"
    echo -e "${CYAN}Happy planning! 📋✨${NC}"
    echo ""
}

# Main installation flow
main() {
    show_banner
    
    # Confirmation prompt
    echo -e "${BLUE}This will install Claude Cascade to $CASCADE_DIR${NC}"
    echo -e "${BLUE}and integrate with Claude Code settings at $CLAUDE_DIR${NC}"
    echo ""
    echo -e "${BLUE}Continue with installation? [Y/n]${NC}"
    read -r response
    if [[ "$response" =~ ^[Nn]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    echo ""
    
    # Installation steps
    check_requirements
    backup_existing_config
    install_hooks
    install_templates
    configure_claude_integration
    install_cli
    
    # Verification and testing
    if verify_installation; then
        run_quick_test
        show_completion
    else
        log "ERROR" "Installation completed with errors. Check the output above."
        echo ""
        echo -e "${YELLOW}You can try running the installer again or check:${NC}"
        echo -e "${YELLOW}   • System requirements${NC}"
        echo -e "${YELLOW}   • File permissions${NC}"
        echo -e "${YELLOW}   • Backup files in: $BACKUP_DIR${NC}"
        exit 1
    fi
}

# Run installer
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi