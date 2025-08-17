#!/bin/bash
# context-resume-checker.sh - Validates project state when conversation resumes
# This script runs automatically when a conversation is resumed or context is limited
# It checks for any incomplete phases and ensures planning compliance

set -euo pipefail

# Configuration
ENFORCE_COMPLETION=true   # Block progress if phases are incomplete
WARN_ON_MISSING=true     # Warn about missing phases
AUTO_SUGGEST_FIXES=true  # Suggest commands to fix issues

# Constants
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
PLANS_DIR="$PROJECT_DIR/.claude/plans"
PHASE1_DIR="$PLANS_DIR/1_pre_exec_plans"
PHASE2_DIR="$PLANS_DIR/2_post_exec_plans" 
PHASE3_DIR="$PLANS_DIR/3_checked_delta_exec_plans"
LOGS_DIR="$PROJECT_DIR/.claude/logs"
RESUME_LOG="$LOGS_DIR/context_resume.log"
STATE_FILE="$SCRIPT_DIR/state/resume_state.json"
VALIDATOR_SCRIPT="$SCRIPT_DIR/pre-action-validator.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
RESET='\033[0m'

# Initialize
mkdir -p "$LOGS_DIR" "$(dirname "$STATE_FILE")"
touch "$RESUME_LOG"

# Check if validator script exists
if [[ ! -x "$VALIDATOR_SCRIPT" ]]; then
    echo -e "${RED}Error:${RESET} Validator script not found or not executable: $VALIDATOR_SCRIPT"
    echo -e "Please run: chmod +x $VALIDATOR_SCRIPT"
    exit 1
fi

# Log function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        info) prefix="${GREEN}[INFO]${RESET}" ;;
        warn) prefix="${YELLOW}[WARN]${RESET}" ;;
        error) prefix="${RED}[ERROR]${RESET}" ;;
        *) prefix="[LOG]" ;;
    esac
    
    echo -e "$prefix $message"
    echo "[$timestamp] [$level] $message" >> "$RESUME_LOG"
}

# Save the current state
save_state() {
    local last_checked=$(date '+%Y-%m-%d %H:%M:%S')
    local incomplete_count="${1:-0}"
    
    # Create JSON state
    cat > "$STATE_FILE" << EOF
{
    "last_checked": "$last_checked",
    "incomplete_count": $incomplete_count,
    "project_dir": "$PROJECT_DIR"
}
EOF
}

# Get incomplete phases
get_incomplete_phases() {
    if [[ ! -d "$PLANS_DIR" ]]; then
        log warn "Plans directory not found: $PLANS_DIR"
        return 1
    fi
    
    # Use the validator to check for incomplete phases
    "$VALIDATOR_SCRIPT" validate_phases
}

# Generate suggestions for fixing issues
generate_suggestions() {
    local plan_id="$1"
    local missing_phase="$2"
    local plan_name="$3"
    
    echo -e "${CYAN}Suggestions to fix:${RESET}"
    
    if [[ "$missing_phase" == "2" ]]; then
        echo -e "  1. Create Phase 2 execution report: ${YELLOW}.claude/plans/2_post_exec_plans/$(date '+%Y%m%d_%H%M%S')_${plan_name}_EXECUTED.md${RESET}"
    elif [[ "$missing_phase" == "3" ]]; then
        echo -e "  1. Create Phase 3 verification report: ${YELLOW}.claude/plans/3_checked_delta_exec_plans/$(date '+%Y%m%d_%H%M%S')_${plan_name}_VERIFICATION.md${RESET}"
    fi
}

# Main function to check context resume compliance
check_context_resume() {
    log info "Context resume check started for project: $PROJECT_DIR"
    
    # Check if plans directory exists
    if [[ ! -d "$PLANS_DIR" ]]; then
        log warn "No plans directory found, skipping context resume check"
        save_state 0
        return 0
    fi
    
    # Get incomplete phases using the validator
    local incomplete_phases=$(get_incomplete_phases)
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        # Found incomplete phases
        local incomplete_count=$(echo "$incomplete_phases" | grep -c ':')
        
        log warn "⚠️ Found $incomplete_count incomplete phase(s)"
        save_state "$incomplete_count"
        
        # Display issues
        echo -e "\n${YELLOW}⚠️ PLANNING COMPLIANCE ISSUE DETECTED ⚠️${RESET}"
        echo -e "${YELLOW}The following plans have incomplete phases:${RESET}\n"
        
        while IFS=: read -r plan_id phase1 phase2 plan_name; do
            if [[ -z "$plan_id" ]]; then
                continue
            fi
            
            if [[ "$phase2" == "2" ]]; then
                echo -e "  • ${MAGENTA}${plan_name}${RESET} is missing ${RED}Phase 2${RESET} execution report"
                
                if [[ "$AUTO_SUGGEST_FIXES" == "true" ]]; then
                    generate_suggestions "$plan_id" "2" "$plan_name"
                fi
            elif [[ "$phase2" == "3" ]]; then
                echo -e "  • ${MAGENTA}${plan_name}${RESET} is missing ${RED}Phase 3${RESET} verification"
                
                if [[ "$AUTO_SUGGEST_FIXES" == "true" ]]; then
                    generate_suggestions "$plan_id" "3" "$plan_name"
                fi
            fi
        done <<< "$incomplete_phases"
        
        echo -e "\n${YELLOW}According to the three-phase planning methodology, all phases must be complete before continuing.${RESET}"
        
        if [[ "$ENFORCE_COMPLETION" == "true" ]]; then
            echo -e "\n${RED}BLOCKING:${RESET} Please complete all phases before proceeding with any new tasks."
            return 1
        else
            echo -e "\n${YELLOW}WARNING:${RESET} Continuing despite incomplete phases. Please complete them when possible."
            return 0
        fi
    else
        # All phases complete
        log info "✅ All plans have complete phases, context resume check passed"
        save_state 0
        echo -e "\n${GREEN}✅ THREE-PHASE COMPLIANCE CHECK PASSED${RESET}"
        echo -e "${GREEN}All plans have complete Phase 1, 2, and 3 documentation.${RESET}"
        return 0
    fi
}

# Entry point
main() {
    # Default behavior is to check resume compliance
    local command="${1:-check}"
    
    case "$command" in
        check)
            check_context_resume
            ;;
        status)
            if [[ -f "$STATE_FILE" ]]; then
                cat "$STATE_FILE"
            else
                echo '{"last_checked": null, "incomplete_count": 0, "project_dir": null}'
            fi
            ;;
        force-pass)
            echo -e "${YELLOW}WARNING:${RESET} Forcing context resume check to pass"
            save_state 0
            echo -e "${GREEN}✅ Context resume check forced to pass state${RESET}"
            ;;
        *)
            echo "Usage: $0 [check|status|force-pass]"
            echo "  check      - Check for incomplete phases (default)"
            echo "  status     - Show the current check status"
            echo "  force-pass - Force the check to pass (use with caution)"
            ;;
    esac
}

# Run with provided arguments
main "$@"