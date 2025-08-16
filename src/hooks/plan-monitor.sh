#!/bin/bash
# plan-monitor.sh - Claude Cascade Planning Workflow Monitor
# Part of Claude Cascade: Intelligent planning workflows for Claude Code
# https://github.com/claudecascade/claude-cascade

set -euo pipefail

# Version and metadata
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_NAME="Claude Cascade Plan Monitor"

# Environment setup
readonly HOOKS_DIR="$(dirname "$0")"
readonly STATE_DIR="$HOOKS_DIR/../../.claude-cascade/state"
readonly PLANS_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/plans"
readonly ACTIVE_PLANS_FILE="$STATE_DIR/active_plans.json"
readonly PLAN_HISTORY_LOG="$STATE_DIR/plan_history.log"
readonly CONFIG_FILE="$STATE_DIR/config.json"

# Logging levels
readonly LOG_DEBUG=0
readonly LOG_INFO=1
readonly LOG_WARN=2
readonly LOG_ERROR=3

# Configuration defaults
declare -A CONFIG=(
    ["log_level"]="$LOG_INFO"
    ["enable_keyword_detection"]="true"
    ["enable_file_monitoring"]="true"
    ["enable_command_monitoring"]="true"
    ["reminder_frequency"]="normal"
)

# Initialize logging
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [[ ${CONFIG[log_level]} -le $level ]]; then
        case $level in
            $LOG_DEBUG) echo "[$timestamp] DEBUG: $message" >&2 ;;
            $LOG_INFO)  echo "[$timestamp] INFO: $message" >&2 ;;
            $LOG_WARN)  echo "[$timestamp] WARN: $message" >&2 ;;
            $LOG_ERROR) echo "[$timestamp] ERROR: $message" >&2 ;;
        esac
    fi
}

# Initialize state files and configuration
init_state_files() {
    mkdir -p "$STATE_DIR" "$PLANS_DIR"/{1_pre_exec_plans,2_post_exec_plans,3_checked_delta_exec_plans}
    
    # Initialize active plans file
    if [[ ! -f "$ACTIVE_PLANS_FILE" ]]; then
        echo '{"active_plans": [], "last_updated": ""}' > "$ACTIVE_PLANS_FILE"
    fi
    
    # Initialize history log
    if [[ ! -f "$PLAN_HISTORY_LOG" ]]; then
        echo "# Claude Cascade Plan History Log" > "$PLAN_HISTORY_LOG"
        echo "# Generated on $(date)" >> "$PLAN_HISTORY_LOG"
    fi
    
    # Load configuration
    load_config
    
    log $LOG_DEBUG "State files initialized successfully"
}

# Load configuration from file
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        while IFS= read -r line; do
            if [[ $line =~ ^[[:space:]]*\"([^\"]+)\":[[:space:]]*\"?([^\"]+)\"?[,}]?$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local value="${BASH_REMATCH[2]}"
                CONFIG["$key"]="$value"
            fi
        done < "$CONFIG_FILE"
        log $LOG_DEBUG "Configuration loaded from $CONFIG_FILE"
    else
        # Create default config
        save_config
    fi
}

# Save current configuration to file
save_config() {
    cat > "$CONFIG_FILE" << EOF
{
    "log_level": ${CONFIG[log_level]},
    "enable_keyword_detection": "${CONFIG[enable_keyword_detection]}",
    "enable_file_monitoring": "${CONFIG[enable_file_monitoring]}",
    "enable_command_monitoring": "${CONFIG[enable_command_monitoring]}",
    "reminder_frequency": "${CONFIG[reminder_frequency]}",
    "last_updated": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
}
EOF
    log $LOG_DEBUG "Configuration saved to $CONFIG_FILE"
}

# Enhanced activity logging with categorization
log_activity() {
    local category="$1"
    local activity="$2"
    local context="${3:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$category] $activity ${context:+($context)}" >> "$PLAN_HISTORY_LOG"
    log $LOG_INFO "$category: $activity"
}

# Enhanced planning keywords with categorization
get_planning_keywords() {
    cat << 'EOF'
IMPLEMENTATION_KEYWORDS=("implement" "build" "create" "develop" "design" "add" "new" "setup" "configure" "integrate")
MAINTENANCE_KEYWORDS=("fix" "refactor" "optimize" "enhance" "improve" "update" "upgrade" "migrate")
WORKFLOW_KEYWORDS=("plan" "feature" "workflow" "system" "component" "service" "architecture")
PROJECT_KEYWORDS=("project" "application" "website" "api" "database" "deployment")
EOF
}

# Check if user prompt contains planning keywords
check_planning_keywords() {
    [[ "${CONFIG[enable_keyword_detection]}" != "true" ]] && { echo '{"decision": "allow"}'; return; }
    
    local input
    input=$(cat)
    
    log $LOG_DEBUG "Analyzing prompt for planning keywords"
    
    # Source keyword definitions
    eval "$(get_planning_keywords)"
    
    local found_keywords=()
    local keyword_categories=()
    
    # Check implementation keywords
    for keyword in "${IMPLEMENTATION_KEYWORDS[@]}"; do
        if echo "$input" | grep -qi "\\b$keyword\\b"; then
            found_keywords+=("$keyword")
            keyword_categories+=("implementation")
        fi
    done
    
    # Check maintenance keywords
    for keyword in "${MAINTENANCE_KEYWORDS[@]}"; do
        if echo "$input" | grep -qi "\\b$keyword\\b"; then
            found_keywords+=("$keyword")
            keyword_categories+=("maintenance")
        fi
    done
    
    # Check workflow keywords
    for keyword in "${WORKFLOW_KEYWORDS[@]}"; do
        if echo "$input" | grep -qi "\\b$keyword\\b"; then
            found_keywords+=("$keyword")
            keyword_categories+=("workflow")
        fi
    done
    
    if [[ ${#found_keywords[@]} -gt 0 ]]; then
        log $LOG_INFO "Found ${#found_keywords[@]} planning keywords: ${found_keywords[*]}"
        check_phase1_exists "${found_keywords[@]}"
    else
        log $LOG_DEBUG "No planning keywords detected"
        echo '{"decision": "allow"}'
    fi
}

# Enhanced Phase 1 existence check with better logic
check_phase1_exists() {
    local keywords=("$@")
    local today=$(date +%Y%m%d)
    local phase1_files
    
    # Check for Phase 1 plans from today
    phase1_files=($(find "$PLANS_DIR/1_pre_exec_plans" -name "${today}_*.md" 2>/dev/null | grep -v TEMPLATE || true))
    
    if [[ ${#phase1_files[@]} -eq 0 ]]; then
        # No Phase 1 plan found today
        local keyword_list
        keyword_list=$(IFS=', '; echo "${keywords[*]}")
        
        log_activity "PROMPT_CHECK" "Planning keywords detected but no Phase 1 plan found" "keywords: $keyword_list"
        
        local urgency_level="normal"
        if [[ ${#keywords[@]} -gt 3 ]]; then
            urgency_level="high"
        fi
        
        # Generate contextual reminder based on reminder frequency setting
        local message="📋 Planning keywords detected. Consider creating a Phase 1 plan in .claude/plans/1_pre_exec_plans/ before starting implementation."
        
        if [[ "${CONFIG[reminder_frequency]}" == "verbose" ]]; then
            message="📋 Planning Activity Detected! Keywords found: [$keyword_list]. Strongly recommend creating a detailed Phase 1 plan in .claude/plans/1_pre_exec_plans/ using format YYYYMMDD_HHMMSS_DESCRIPTIVE_NAME.md to ensure proper workflow tracking."
        elif [[ "${CONFIG[reminder_frequency]}" == "minimal" ]]; then
            message="📋 Consider creating a Phase 1 plan for this work."
        fi
        
        echo '{
            "decision": "allow",
            "message": "'"$message"'",
            "metadata": {
                "detected_keywords": ["'$(IFS='","'; echo "${keywords[*]}")'"],
                "keyword_count": '${#keywords[@]}',
                "urgency_level": "'"$urgency_level"'",
                "phase_status": "missing_phase_1",
                "suggestion": "Use format: YYYYMMDD_HHMMSS_DESCRIPTIVE_NAME.md",
                "cascade_version": "'"$SCRIPT_VERSION"'"
            }
        }'
    else
        # Phase 1 plan exists
        log_activity "PROMPT_CHECK" "Planning keywords detected with existing Phase 1 plan" "plans: ${#phase1_files[@]}"
        echo '{"decision": "allow"}'
    fi
}

# Enhanced file operation monitoring
check_before_write() {
    [[ "${CONFIG[enable_file_monitoring]}" != "true" ]] && { echo '{"decision": "allow"}'; return; }
    
    local tool_input
    tool_input=$(cat)
    
    log $LOG_DEBUG "Analyzing file operation for planning compliance"
    
    # Extract file information from tool input
    local file_path
    file_path=$(echo "$tool_input" | jq -r '.file_path // .path // empty' 2>/dev/null || echo "")
    
    # Skip monitoring for certain file types
    local skip_patterns=(
        "\\.(md|log|txt|json)$"
        "/\\.claude/"
        "/\\.git/"
        "TEMPLATE"
        "README"
        "package-lock\\.json"
        "\\.env"
    )
    
    for pattern in "${skip_patterns[@]}"; do
        if [[ "$file_path" =~ $pattern ]]; then
            log $LOG_DEBUG "Skipping monitoring for file: $file_path (matches pattern: $pattern)"
            echo '{"decision": "allow"}'
            return
        fi
    done
    
    # Check if Phase 1 plan exists
    local today=$(date +%Y%m%d)
    local phase1_files
    phase1_files=($(find "$PLANS_DIR/1_pre_exec_plans" -name "${today}_*.md" 2>/dev/null | grep -v TEMPLATE || true))
    
    if [[ ${#phase1_files[@]} -eq 0 ]]; then
        log_activity "PRE_WRITE_CHECK" "Major file operation without Phase 1 plan" "file: $file_path"
        
        echo '{
            "decision": "allow",
            "message": "⚠️  Major file changes detected. Consider documenting this work with a Phase 1 plan for better tracking.",
            "metadata": {
                "file_path": "'"$file_path"'",
                "phase_status": "missing_phase_1",
                "suggestion": "Create plan in .claude/plans/1_pre_exec_plans/",
                "operation_type": "file_modification",
                "cascade_version": "'"$SCRIPT_VERSION"'"
            }
        }'
    else
        log_activity "PRE_WRITE_CHECK" "File operation with existing Phase 1 plan" "file: $file_path, plans: ${#phase1_files[@]}"
        echo '{"decision": "allow"}'
    fi
}

# Enhanced command monitoring with intelligent categorization
check_before_bash() {
    [[ "${CONFIG[enable_command_monitoring]}" != "true" ]] && { echo '{"decision": "allow"}'; return; }
    
    local tool_input
    tool_input=$(cat)
    
    log $LOG_DEBUG "Analyzing bash command for planning compliance"
    
    # Extract command from tool input
    local command
    command=$(echo "$tool_input" | jq -r '.command // empty' 2>/dev/null || echo "")
    
    # Categorize commands
    local readonly_commands=(
        "^(ls|cat|head|tail|grep|find|which|echo|date|pwd|whoami|wc|sort|uniq)"
        "^(git status|git log|git diff|git show)"
        "^(ps|top|df|du|free|uptime)"
    )
    
    local significant_commands=(
        "(install|build|deploy|start|stop|restart|migrate|create|setup)"
        "(npm|yarn|pip|cargo|go) (install|build|run)"
        "(docker|kubectl)"
        "(terraform|ansible)"
    )
    
    # Check if command is read-only
    for pattern in "${readonly_commands[@]}"; do
        if [[ "$command" =~ $pattern ]]; then
            log $LOG_DEBUG "Read-only command detected: $command"
            echo '{"decision": "allow"}'
            return
        fi
    done
    
    # Check for significant commands
    local is_significant=false
    for pattern in "${significant_commands[@]}"; do
        if [[ "$command" =~ $pattern ]]; then
            is_significant=true
            break
        fi
    done
    
    if [[ "$is_significant" == true ]]; then
        local today=$(date +%Y%m%d)
        local phase1_files
        phase1_files=($(find "$PLANS_DIR/1_pre_exec_plans" -name "${today}_*.md" 2>/dev/null | grep -v TEMPLATE || true))
        
        if [[ ${#phase1_files[@]} -eq 0 ]]; then
            log_activity "PRE_BASH_CHECK" "Significant command without Phase 1 plan" "command: $command"
            
            echo '{
                "decision": "allow",
                "message": "🔧 Significant command detected. Consider creating a Phase 1 plan to document this work for better tracking and team coordination.",
                "metadata": {
                    "command": "'"$command"'",
                    "phase_status": "missing_phase_1",
                    "suggestion": "Document in .claude/plans/1_pre_exec_plans/",
                    "operation_type": "significant_command",
                    "cascade_version": "'"$SCRIPT_VERSION"'"
                }
            }'
        else
            log_activity "PRE_BASH_CHECK" "Significant command with existing Phase 1 plan" "command: $command, plans: ${#phase1_files[@]}"
            echo '{"decision": "allow"}'
        fi
    else
        log $LOG_DEBUG "Non-significant command: $command"
        echo '{"decision": "allow"}'
    fi
}

# Display version and help information
show_version() {
    cat << EOF
$SCRIPT_NAME v$SCRIPT_VERSION
Part of Claude Cascade: Intelligent planning workflows for Claude Code

For more information, visit: https://github.com/claudecascade/claude-cascade
EOF
}

# Main execution with enhanced error handling
main() {
    # Handle version request
    if [[ "${1:-}" == "--version" ]]; then
        show_version
        exit 0
    fi
    
    # Initialize with error handling
    if ! init_state_files; then
        log $LOG_ERROR "Failed to initialize state files"
        echo '{"decision": "allow", "error": "State initialization failed"}'
        exit 1
    fi
    
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
        "config")
            case "${2:-}" in
                "get") echo "${CONFIG[${3:-}]:-}" ;;
                "set") 
                    if [[ -n "${3:-}" && -n "${4:-}" ]]; then
                        CONFIG["$3"]="$4"
                        save_config
                        echo "Configuration updated: $3 = $4"
                    fi
                    ;;
                *) echo "Usage: config [get|set] <key> [value]" ;;
            esac
            ;;
        *)
            echo '{"decision": "allow", "message": "Claude Cascade Plan Monitor: Unknown command '"${1:-}"'"}'
            ;;
    esac
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi