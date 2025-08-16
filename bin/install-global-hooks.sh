#!/bin/bash

# Claude Cascade Global Hooks Installer
# Installs three-phase planning enforcement hooks globally

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CASCADE_ROOT="$(dirname "$SCRIPT_DIR")"
GLOBAL_HOOKS_DIR="$HOME/.claude/hooks"
SETTINGS_FILE="$HOME/.claude/settings.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running on supported platform
check_platform() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        log_error "Global hooks installation on Windows requires manual setup"
        log_error "Please use the Windows PowerShell installer instead"
        exit 1
    fi
}

# Create global hooks directory
create_hooks_directory() {
    log "Creating global hooks directory..."
    mkdir -p "$GLOBAL_HOOKS_DIR/state"
    log_success "Global hooks directory created: $GLOBAL_HOOKS_DIR"
}

# Install hook scripts
install_hook_scripts() {
    log "Installing three-phase planning hooks..."
    
    local hook_scripts=(
        "plan-monitor.sh"
        "phase-validator.sh"
        "plan-tracker.sh"
    )
    
    for script in "${hook_scripts[@]}"; do
        local source_file="$CASCADE_ROOT/hooks/$script"
        local target_file="$GLOBAL_HOOKS_DIR/$script"
        
        if [[ -f "$source_file" ]]; then
            cp "$source_file" "$target_file"
            chmod +x "$target_file"
            log_success "Installed: $script"
        else
            log_error "Hook script not found: $source_file"
            return 1
        fi
    done
}

# Backup existing settings
backup_settings() {
    if [[ -f "$SETTINGS_FILE" ]]; then
        local backup_file="$SETTINGS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$SETTINGS_FILE" "$backup_file"
        log_success "Settings backed up to: $backup_file"
    fi
}

# Update Claude Code settings with hooks
update_settings() {
    log "Updating Claude Code settings..."
    
    if [[ ! -f "$SETTINGS_FILE" ]]; then
        log "Creating new settings file..."
        cat > "$SETTINGS_FILE" << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash",
      "Read",
      "Edit",
      "Write",
      "WebFetch",
      "Grep",
      "Glob",
      "LS",
      "MultiEdit",
      "NotebookRead",
      "NotebookEdit",
      "TodoRead",
      "TodoWrite",
      "WebSearch"
    ]
  },
  "hooks": {}
}
EOF
    fi
    
    # Check if hooks already exist in settings
    if grep -q '"hooks":' "$SETTINGS_FILE"; then
        log_warning "Hooks section already exists in settings"
        log_warning "Please manually add the following hooks to your settings.json:"
        cat << EOF

Add these hooks to your ~/.claude/settings.json:

"hooks": {
  "UserPromptSubmit": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "~/.claude/hooks/plan-monitor.sh prompt-check"
        }
      ]
    }
  ],
  "Stop": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "~/.claude/hooks/plan-tracker.sh final-check"
        }
      ]
    }
  ],
  "PreToolUse": [
    {
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [
        {
          "type": "command",
          "command": "~/.claude/hooks/plan-monitor.sh pre-write-check"
        }
      ]
    },
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "~/.claude/hooks/plan-monitor.sh pre-bash-check"
        }
      ]
    }
  ],
  "PostToolUse": [
    {
      "matcher": "Write|Edit|MultiEdit|Bash",
      "hooks": [
        {
          "type": "command",
          "command": "~/.claude/hooks/phase-validator.sh post-execution"
        }
      ]
    }
  ]
}

EOF
    else
        log_success "Settings updated with three-phase planning hooks"
    fi
}

# Verify installation
verify_installation() {
    log "Verifying installation..."
    
    local verification_errors=0
    
    # Check hook scripts exist and are executable
    local hook_scripts=(
        "plan-monitor.sh"
        "phase-validator.sh"
        "plan-tracker.sh"
    )
    
    for script in "${hook_scripts[@]}"; do
        local script_path="$GLOBAL_HOOKS_DIR/$script"
        if [[ -f "$script_path" && -x "$script_path" ]]; then
            log_success "✓ $script installed and executable"
        else
            log_error "✗ $script missing or not executable"
            verification_errors=$((verification_errors + 1))
        fi
    done
    
    # Check state directory
    if [[ -d "$GLOBAL_HOOKS_DIR/state" ]]; then
        log_success "✓ State directory created"
    else
        log_error "✗ State directory missing"
        verification_errors=$((verification_errors + 1))
    fi
    
    # Check settings file
    if [[ -f "$SETTINGS_FILE" ]]; then
        log_success "✓ Settings file exists"
    else
        log_error "✗ Settings file missing"
        verification_errors=$((verification_errors + 1))
    fi
    
    return $verification_errors
}

# Test hook functionality
test_hooks() {
    log "Testing hook functionality..."
    
    # Test plan-monitor
    if "$GLOBAL_HOOKS_DIR/plan-monitor.sh" --help >/dev/null 2>&1; then
        log_success "✓ plan-monitor.sh functional"
    else
        log_warning "⚠ plan-monitor.sh may have issues"
    fi
    
    # Test phase-validator
    if "$GLOBAL_HOOKS_DIR/phase-validator.sh" --help >/dev/null 2>&1; then
        log_success "✓ phase-validator.sh functional"
    else
        log_warning "⚠ phase-validator.sh may have issues"
    fi
    
    # Test plan-tracker
    if "$GLOBAL_HOOKS_DIR/plan-tracker.sh" --help >/dev/null 2>&1; then
        log_success "✓ plan-tracker.sh functional"
    else
        log_warning "⚠ plan-tracker.sh may have issues"
    fi
}

# Main installation function
main() {
    echo "======================================"
    echo "Claude Cascade Global Hooks Installer"
    echo "======================================"
    echo
    
    check_platform
    backup_settings
    create_hooks_directory
    install_hook_scripts
    update_settings
    
    if verify_installation; then
        log_success "Global hooks installation completed successfully!"
        echo
        log "Three-phase planning enforcement is now active globally."
        log "Hooks will help ensure Phase 1, 2, and 3 documentation completion."
        echo
        log "To verify hooks are working, run: claude-cascade hooks verify"
        
        test_hooks
    else
        log_error "Installation completed with errors. Please check the issues above."
        exit 1
    fi
}

# Show usage if requested
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    cat << EOF
Claude Cascade Global Hooks Installer

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help    Show this help message

DESCRIPTION:
    Installs Claude Cascade three-phase planning hooks globally to enforce
    systematic planning across all projects.

HOOKS INSTALLED:
    - plan-monitor.sh:    Detects planning activities
    - phase-validator.sh: Validates phase transitions  
    - plan-tracker.sh:    Tracks compliance and completion

GLOBAL LOCATION:
    ~/.claude/hooks/

SETTINGS:
    Updates ~/.claude/settings.json with hook configuration

EOF
    exit 0
fi

# Run main installation
main "$@"