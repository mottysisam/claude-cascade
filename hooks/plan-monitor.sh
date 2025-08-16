#!/bin/bash
# plan-monitor.sh - Main planning workflow monitor
# Detects planning activities and ensures Phase 1 plans are created

set -euo pipefail

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

# Check if user prompt contains planning keywords
check_planning_keywords() {
    local input
    input=$(cat)
    
    # Planning keywords that suggest a plan should be created
    local keywords=(
        "implement" "build" "create" "develop" "design" "plan"
        "feature" "add" "new" "setup" "configure" "integrate"
        "workflow" "system" "component" "service" "fix"
        "refactor" "optimize" "enhance" "improve"
    )
    
    local found_keywords=()
    for keyword in "${keywords[@]}"; do
        if echo "$input" | grep -qi "\\b$keyword\\b"; then
            found_keywords+=("$keyword")
        fi
    done
    
    if [[ ${#found_keywords[@]} -gt 0 ]]; then
        check_phase1_exists "${found_keywords[@]}"
    else
        # No planning keywords found, allow without reminder
        echo '{"decision": "allow"}'
    fi
}

# Check if Phase 1 plan exists for current context
check_phase1_exists() {
    local keywords=("$@")
    local phase1_files
    
    # Check if any Phase 1 plan exists from today
    phase1_files=$(find "$PLANS_DIR/1_pre_exec_plans" -name "$(date +%Y%m%d)_*.md" 2>/dev/null | wc -l || echo 0)
    
    if [[ $phase1_files -eq 0 ]]; then
        # No Phase 1 plan found, suggest creating one
        local keyword_list
        keyword_list=$(IFS=', '; echo "${keywords[*]}")
        
        log_activity "PROMPT_CHECK: Planning keywords detected ($keyword_list) but no Phase 1 plan found"
        
        echo '{
            "decision": "allow",
            "message": "📋 Planning keywords detected. Consider creating a Phase 1 plan in .claude/plans/1_pre_exec_plans/ before starting implementation.",
            "metadata": {
                "detected_keywords": ["'$(IFS='","'; echo "${keywords[*]}")'"],
                "phase_status": "missing_phase_1",
                "suggestion": "Use format: YYYYMMDD_HHMMSS_DESCRIPTIVE_NAME.md"
            }
        }'
    else
        # Phase 1 plan exists, allow silently
        log_activity "PROMPT_CHECK: Planning keywords detected with existing Phase 1 plan"
        echo '{"decision": "allow"}'
    fi
}

# Check before major file operations
check_before_write() {
    local tool_input
    tool_input=$(cat)
    
    # Extract file path from tool input (simplified)
    local file_path
    file_path=$(echo "$tool_input" | jq -r '.file_path // .path // empty' 2>/dev/null || echo "")
    
    # Skip checks for template files, logs, and documentation
    if [[ "$file_path" =~ \.(md|log|txt)$ ]] || [[ "$file_path" =~ /\.claude/ ]] || [[ "$file_path" =~ TEMPLATE ]]; then
        echo '{"decision": "allow"}'
        return
    fi
    
    # Check if Phase 1 plan exists
    local phase1_files
    phase1_files=$(find "$PLANS_DIR/1_pre_exec_plans" -name "$(date +%Y%m%d)_*.md" 2>/dev/null | wc -l || echo 0)
    
    if [[ $phase1_files -eq 0 ]]; then
        log_activity "PRE_WRITE_CHECK: Major file operation without Phase 1 plan (file: $file_path)"
        
        echo '{
            "decision": "allow",
            "message": "⚠️  Major file changes detected. Consider documenting this work with a Phase 1 plan.",
            "metadata": {
                "file_path": "'$file_path'",
                "phase_status": "missing_phase_1",
                "suggestion": "Create plan in .claude/plans/1_pre_exec_plans/"
            }
        }'
    else
        log_activity "PRE_WRITE_CHECK: File operation with existing Phase 1 plan (file: $file_path)"
        echo '{"decision": "allow"}'
    fi
}

# Check before bash commands
check_before_bash() {
    local tool_input
    tool_input=$(cat)
    
    # Extract command from tool input
    local command
    command=$(echo "$tool_input" | jq -r '.command // empty' 2>/dev/null || echo "")
    
    # Skip checks for read-only commands and system queries
    if [[ "$command" =~ ^(ls|cat|head|tail|grep|find|which|echo|date|pwd|whoami) ]] || 
       [[ "$command" =~ ^(git status|git log|git diff) ]]; then
        echo '{"decision": "allow"}'
        return
    fi
    
    # Check for significant commands that might need planning
    if [[ "$command" =~ (install|build|deploy|start|stop|restart|migrate|create|setup) ]]; then
        local phase1_files
        phase1_files=$(find "$PLANS_DIR/1_pre_exec_plans" -name "$(date +%Y%m%d)_*.md" 2>/dev/null | wc -l || echo 0)
        
        if [[ $phase1_files -eq 0 ]]; then
            log_activity "PRE_BASH_CHECK: Significant command without Phase 1 plan (command: $command)"
            
            echo '{
                "decision": "allow",
                "message": "🔧 Significant command detected. Consider creating a Phase 1 plan to document this work.",
                "metadata": {
                    "command": "'$command'",
                    "phase_status": "missing_phase_1",
                    "suggestion": "Document in .claude/plans/1_pre_exec_plans/"
                }
            }'
        else
            log_activity "PRE_BASH_CHECK: Significant command with existing Phase 1 plan (command: $command)"
            echo '{"decision": "allow"}'
        fi
    else
        echo '{"decision": "allow"}'
    fi
}

# Main execution
main() {
    init_state_files
    
    case "${1:-}" in
        "prompt-check")
            check_planning_keywords
            ;;
        "pre-write-check")
            check_before_write
            ;;
        "pre-bash-check")
            check_before_bash
            ;;
        *)
            echo '{"decision": "allow", "message": "Plan monitor: Unknown command '$1'"}'
            ;;
    esac
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi