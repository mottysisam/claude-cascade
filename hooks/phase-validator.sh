#!/bin/bash
# phase-validator.sh - Validates phase transitions and completeness
# Tracks execution progress and reminds about Phase 2/3 documentation

set -euo pipefail

# Ensure required environment variables
CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Constants
HOOKS_DIR="$(dirname "$0")"
STATE_DIR="$HOOKS_DIR/state"
PLANS_DIR="$CLAUDE_PROJECT_DIR/.claude/plans"
ACTIVE_PLANS_FILE="$STATE_DIR/active_plans.json"
PLAN_HISTORY_LOG="$STATE_DIR/plan_history.log"

# Initialize state files if they don't exist
init_state_files() {
    mkdir -p "$STATE_DIR" "$PLANS_DIR"/{1_pre_exec_plans,2_post_exec_plans,3_checked_delta_exec_plans}
    
    if [[ ! -f "$ACTIVE_PLANS_FILE" ]]; then
        echo '{"active_plans": [], "last_updated": ""}' > "$ACTIVE_PLANS_FILE"
    fi
    
    if [[ ! -f "$PLAN_HISTORY_LOG" ]]; then
        touch "$PLAN_HISTORY_LOG"
    fi
}

# Log activity to plan history
log_activity() {
    local activity="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $activity" >> "$PLAN_HISTORY_LOG"
}

# Get today's plan files for each phase
get_todays_plans() {
    local phase="$1"
    local today=$(date +%Y%m%d)
    find "$PLANS_DIR/${phase}" -name "${today}_*.md" 2>/dev/null | wc -l || echo 0
}

# Check if Phase 2 documentation is needed after execution
check_post_execution() {
    local tool_input
    tool_input=$(cat)
    
    # Extract tool and operation details
    local tool_name
    tool_name=$(echo "$tool_input" | jq -r '.tool_name // empty' 2>/dev/null || echo "unknown")
    
    # Get current plan counts
    local phase1_count phase2_count
    phase1_count=$(get_todays_plans "1_pre_exec_plans")
    phase2_count=$(get_todays_plans "2_post_exec_plans")
    
    # If we have Phase 1 plans but no Phase 2, remind about documentation
    if [[ $phase1_count -gt 0 && $phase2_count -eq 0 ]]; then
        # Check if this is a significant operation that suggests execution
        if [[ "$tool_name" =~ ^(Write|Edit|MultiEdit|Bash)$ ]]; then
            log_activity "POST_EXECUTION: Significant operation completed, Phase 2 documentation needed (tool: $tool_name)"
            
            echo '{
                "decision": "approve",
                "message": "📝 Execution detected. Consider creating Phase 2 documentation to record what was actually done.",
                "metadata": {
                    "tool_used": "'$tool_name'",
                    "phase1_plans": '$phase1_count',
                    "phase2_docs": '$phase2_count',
                    "suggestion": "Create execution report in .claude/plans/2_post_exec_plans/"
                }
            }'
            return
        fi
    fi
    
    # If we have Phase 2 but no Phase 3, check for test-related commands
    local phase3_count
    phase3_count=$(get_todays_plans "3_checked_delta_exec_plans")
    
    if [[ $phase2_count -gt 0 && $phase3_count -eq 0 ]]; then
        # Check if this might be a test or verification command
        local command
        command=$(echo "$tool_input" | jq -r '.command // empty' 2>/dev/null || echo "")
        
        if [[ "$command" =~ (test|check|verify|validate|lint|build) ]] || 
           [[ "$tool_name" == "Bash" && "$command" =~ (npm|yarn|pytest|cargo|go test) ]]; then
            log_activity "POST_EXECUTION: Verification command detected, Phase 3 needed (command: $command)"
            
            echo '{
                "decision": "approve",
                "message": "🧪 Verification activities detected. Consider creating Phase 3 documentation to validate completion.",
                "metadata": {
                    "verification_command": "'$command'",
                    "phase2_docs": '$phase2_count',
                    "phase3_verifications": '$phase3_count',
                    "suggestion": "Create verification report in .claude/plans/3_checked_delta_exec_plans/"
                }
            }'
            return
        fi
    fi
    
    # Default: allow without message
    echo '{"decision": "approve"}'
}

# Validate phase completeness
validate_phase() {
    local phase="$1"
    local plan_file="$2"
    
    if [[ ! -f "$plan_file" ]]; then
        echo '{"valid": false, "reason": "Plan file does not exist"}'
        return
    fi
    
    case "$phase" in
        "1")
            # Phase 1 validation: Check for required sections
            local required_sections=("Objective" "Detailed Steps" "Success Criteria")
            local missing_sections=()
            
            for section in "${required_sections[@]}"; do
                if ! grep -q "## $section" "$plan_file"; then
                    missing_sections+=("$section")
                fi
            done
            
            if [[ ${#missing_sections[@]} -gt 0 ]]; then
                echo '{"valid": false, "reason": "Missing sections: '$(IFS=', '; echo "${missing_sections[*]}")'"}'
            else
                echo '{"valid": true, "completeness": "good"}'
            fi
            ;;
        "2")
            # Phase 2 validation: Check for execution details
            local required_sections=("What Was Executed" "Results Achieved")
            local missing_sections=()
            
            for section in "${required_sections[@]}"; do
                if ! grep -q "## $section" "$plan_file"; then
                    missing_sections+=("$section")
                fi
            done
            
            if [[ ${#missing_sections[@]} -gt 0 ]]; then
                echo '{"valid": false, "reason": "Missing sections: '$(IFS=', '; echo "${missing_sections[*]}")'"}'
            else
                echo '{"valid": true, "completeness": "good"}'
            fi
            ;;
        "3")
            # Phase 3 validation: Check for verification tests
            if ! grep -q "## Verification Tests Performed" "$plan_file"; then
                echo '{"valid": false, "reason": "Missing verification tests section"}'
            elif ! grep -q "**Command/Action:**" "$plan_file"; then
                echo '{"valid": false, "reason": "No actual verification tests documented"}'
            else
                echo '{"valid": true, "completeness": "good"}'
            fi
            ;;
        *)
            echo '{"valid": false, "reason": "Unknown phase"}'
            ;;
    esac
}

# Get phase transition suggestions
get_phase_suggestions() {
    local phase1_count phase2_count phase3_count
    phase1_count=$(get_todays_plans "1_pre_exec_plans")
    phase2_count=$(get_todays_plans "2_post_exec_plans")
    phase3_count=$(get_todays_plans "3_checked_delta_exec_plans")
    
    local suggestions=()
    
    if [[ $phase1_count -gt $phase2_count ]]; then
        suggestions+=("Create Phase 2 documentation for executed plans")
    fi
    
    if [[ $phase2_count -gt $phase3_count ]]; then
        suggestions+=("Create Phase 3 verification for completed executions")
    fi
    
    if [[ ${#suggestions[@]} -gt 0 ]]; then
        printf '%s\n' "${suggestions[@]}"
    fi
}

# Main execution
main() {
    init_state_files
    
    case "${1:-}" in
        "post-execution")
            check_post_execution
            ;;
        "verify-phase")
            validate_phase "${2:-}" "${3:-}"
            ;;
        "suggestions")
            get_phase_suggestions
            ;;
        *)
            echo '{"decision": "approve", "message": "Phase validator: Unknown command '$1'"}'
            ;;
    esac
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi