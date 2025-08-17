#!/bin/bash
# Install Git hooks for three-phase planning enforcement

set -euo pipefail

# Constants
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
HOOKS_DIR="$GIT_ROOT/.git/hooks"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

# Check if in Git repository
check_git_repo() {
    if [[ ! -d "$GIT_ROOT/.git" ]]; then
        echo -e "${RED}Error:${RESET} Not in a Git repository"
        return 1
    fi
    return 0
}

# Create hooks directory if needed
create_hooks_dir() {
    if [[ ! -d "$HOOKS_DIR" ]]; then
        echo -e "${BLUE}Creating hooks directory:${RESET} $HOOKS_DIR"
        mkdir -p "$HOOKS_DIR"
    fi
}

# Install a hook
install_hook() {
    local hook_name="$1"
    local source_file="$2"
    local target_file="$HOOKS_DIR/$hook_name"
    
    if [[ ! -f "$source_file" ]]; then
        echo -e "${RED}Error:${RESET} Source hook file not found: $source_file"
        return 1
    fi
    
    # Check if hook already exists
    if [[ -f "$target_file" ]]; then
        echo -e "${YELLOW}Hook already exists:${RESET} $target_file"
        echo -e "Checking if it's our hook..."
        
        if grep -q "Claude Cascade" "$target_file"; then
            echo -e "${BLUE}Updating existing Claude Cascade hook${RESET}"
        else {
            echo -e "${YELLOW}Warning:${RESET} Existing hook is not from Claude Cascade"
            read -p "Replace it? (y/N): " confirm
            if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
                echo "Skipping hook installation"
                return 0
            fi
        }
        fi
    fi
    
    # Copy the hook
    cp "$source_file" "$target_file"
    chmod +x "$target_file"
    
    echo -e "${GREEN}✅ Installed hook:${RESET} $hook_name"
    return 0
}

# Main function
main() {
    echo -e "${BLUE}Installing Claude Cascade Git hooks...${RESET}"
    
    if ! check_git_repo; then
        echo -e "${YELLOW}Warning:${RESET} Not in a Git repository, hooks will not be installed"
        exit 1
    fi
    
    create_hooks_dir
    
    # Install pre-commit hook
    install_hook "pre-commit" "$SCRIPT_DIR/git-pre-commit-hook"
    
    echo -e "\n${GREEN}✅ Git hooks installation complete${RESET}"
    echo -e "Hooks installed in: $HOOKS_DIR"
    echo -e "To bypass hooks temporarily: ${YELLOW}SKIP_CLAUDE_HOOKS=1 git commit${RESET}"
}

# Run the main function
main "$@"