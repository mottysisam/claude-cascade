#!/bin/bash
# phase-validator.sh - Claude Cascade Phase Transition Validator
# Part of Claude Cascade: Intelligent planning workflows for Claude Code
# https://github.com/claudecascade/claude-cascade

set -euo pipefail

# Version and metadata
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_NAME="Claude Cascade Phase Validator"

# Environment setup
readonly HOOKS_DIR="$(dirname "$0")"
readonly STATE_DIR="$HOOKS_DIR/../../.claude-cascade/state"
readonly PLANS_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/plans"
readonly ACTIVE_PLANS_FILE="$STATE_DIR/active_plans.json"
readonly PLAN_HISTORY_LOG="$STATE_DIR/plan_history.log"
readonly VALIDATION_LOG="$STATE_DIR/validation.log"

# Phase validation rules
declare -A PHASE1_REQUIRED_SECTIONS=(
    ["Objective"]="Essential"
    ["Detailed Steps"]="Essential"
    ["Success Criteria"]="Essential"
    ["Resources Required"]="Important"
    ["Expected Outcomes"]="Important"
)

declare -A PHASE2_REQUIRED_SECTIONS=(
    ["What Was Executed"]="Essential"
    ["Results Achieved"]="Essential" 
    ["Issues Encountered"]="Important"
    ["Deviations from Plan"]="Important"
    ["Lessons Learned"]="Important"
)

declare -A PHASE3_REQUIRED_SECTIONS=(
    ["Verification Tests Performed"]="Essential"
    ["Pre vs Post Comparison"]="Essential"
    ["Overall Assessment"]="Essential"
    ["Final Status"]="Essential"
)

# Logging levels
readonly LOG_DEBUG=0
readonly LOG_INFO=1
readonly LOG_WARN=2
readonly LOG_ERROR=3

# Initialize logging
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        $LOG_DEBUG) echo "[$timestamp] DEBUG: $message" >&2 ;;
        $LOG_INFO)  echo "[$timestamp] INFO: $message" >&2 ;;
        $LOG_WARN)  echo "[$timestamp] WARN: $message" >&2 ;;
        $LOG_ERROR) echo "[$timestamp] ERROR: $message" >&2 ;;
    esac
}

# Initialize state files
init_state_files() {
    mkdir -p "$STATE_DIR" "$PLANS_DIR"/{1_pre_exec_plans,2_post_exec_plans,3_checked_delta_exec_plans}
    
    if [[ ! -f "$ACTIVE_PLANS_FILE" ]]; then
        echo '{"active_plans": [], "last_updated": ""}' > "$ACTIVE_PLANS_FILE"
    fi
    
    if [[ ! -f "$PLAN_HISTORY_LOG" ]]; then
        echo "# Claude Cascade Plan History Log" > "$PLAN_HISTORY_LOG"
    fi
    
    if [[ ! -f "$VALIDATION_LOG" ]]; then
        echo "# Claude Cascade Validation Log" > "$VALIDATION_LOG"
        echo "# Generated on $(date)" >> "$VALIDATION_LOG"
    fi
    
    log $LOG_DEBUG "Phase validator state files initialized"
}

# Enhanced activity logging
log_activity() {
    local category="$1"
    local activity="$2"
    local context="${3:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$category] $activity ${context:+($context)}" >> "$PLAN_HISTORY_LOG"
    log $LOG_INFO "$category: $activity"
}

# Log validation results
log_validation() {
    local validation_type="$1"
    local result="$2"
    local details="${3:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] VALIDATION: $validation_type -> $result ${details:+| $details}" >> "$VALIDATION_LOG"
}

# Get today's plan files for each phase with enhanced filtering
get_todays_plans() {
    local phase="$1"
    local date_pattern="${2:-$(date +%Y%m%d)}"
    
    find "$PLANS_DIR/${phase}" -name "${date_pattern}_*.md" 2>/dev/null | grep -v TEMPLATE | wc -l || echo 0
}

# Enhanced plan file analysis with metadata extraction
analyze_plan_files() {
    local phase="$1"
    local date_pattern="${2:-$(date +%Y%m%d)}"
    
    local files=($(find "$PLANS_DIR/${phase}" -name "${date_pattern}_*.md" 2>/dev/null | grep -v TEMPLATE || true))
    local analysis=()
    
    for file in "${files[@]}"; do
        local base_name=$(basename "$file" .md)
        local creation_time=$(stat -f "%m" "$file" 2>/dev/null || stat -c "%Y" "$file" 2>/dev/null || echo "0")
        local file_size=$(stat -f "%z" "$file" 2>/dev/null || stat -c "%s" "$file" 2>/dev/null || echo "0")
        
        analysis+=("$base_name:$creation_time:$file_size")
    done
    
    printf '%s\n' "${analysis[@]}"
}

# Intelligent post-execution analysis with enhanced context awareness
check_post_execution() {
    local tool_input
    tool_input=$(cat)
    
    log $LOG_DEBUG "Analyzing post-execution context for phase recommendations"
    
    # Extract comprehensive tool information
    local tool_name tool_result command file_path
    tool_name=$(echo "$tool_input" | jq -r '.tool_name // .tool // empty' 2>/dev/null || echo "unknown")
    tool_result=$(echo "$tool_input" | jq -r '.result // .output // empty' 2>/dev/null || echo "")
    command=$(echo "$tool_input" | jq -r '.command // empty' 2>/dev/null || echo "")
    file_path=$(echo "$tool_input" | jq -r '.file_path // .path // empty' 2>/dev/null || echo "")
    
    # Get current plan counts with enhanced analysis
    local phase1_count phase2_count phase3_count
    phase1_count=$(get_todays_plans "1_pre_exec_plans")
    phase2_count=$(get_todays_plans "2_post_exec_plans")
    phase3_count=$(get_todays_plans "3_checked_delta_exec_plans")
    
    log $LOG_DEBUG "Plan counts - Phase1: $phase1_count, Phase2: $phase2_count, Phase3: $phase3_count"
    
    # Phase 2 recommendation logic
    if [[ $phase1_count -gt 0 && $phase2_count -lt $phase1_count ]]; then
        if [[ "$tool_name" =~ ^(Write|Edit|MultiEdit|Bash)$ ]]; then
            # Analyze execution significance
            local execution_significance="normal"
            local execution_context=""
            
            # Determine significance based on multiple factors
            if [[ -n "$file_path" ]]; then
                if [[ "$file_path" =~ \.(js|ts|py|go|rs|java|cpp|c)$ ]]; then
                    execution_significance="high"
                    execution_context="source code modification"
                elif [[ "$file_path" =~ \.(json|yaml|yml|toml|config)$ ]]; then
                    execution_significance="medium"
                    execution_context="configuration change"
                fi
            fi
            
            if [[ -n "$command" ]]; then
                if [[ "$command" =~ (deploy|build|install|migrate|setup) ]]; then
                    execution_significance="high"
                    execution_context="infrastructure operation"
                elif [[ "$command" =~ (test|lint|format) ]]; then
                    execution_significance="medium"
                    execution_context="quality assurance"
                fi
            fi
            
            log_activity "POST_EXECUTION" "Execution detected, Phase 2 documentation recommended" "tool: $tool_name, significance: $execution_significance"
            
            local message="📝 Execution detected. Consider creating Phase 2 documentation to record what was actually accomplished."
            if [[ "$execution_significance" == "high" ]]; then
                message="📝 Significant execution detected! Creating Phase 2 documentation is strongly recommended to maintain proper audit trail and team coordination."
            fi
            
            echo '{
                "decision": "allow",
                "message": "'"$message"'",
                "metadata": {
                    "tool_used": "'"$tool_name"'",
                    "execution_context": "'"$execution_context"'",
                    "significance_level": "'"$execution_significance"'",
                    "phase1_plans": '$phase1_count',
                    "phase2_docs": '$phase2_count',
                    "plans_pending_documentation": '$((phase1_count - phase2_count))',
                    "suggestion": "Create execution report in .claude/plans/2_post_exec_plans/",
                    "cascade_version": "'"$SCRIPT_VERSION"'"
                }
            }'
            return
        fi
    fi
    
    # Phase 3 recommendation logic
    if [[ $phase2_count -gt 0 && $phase3_count -lt $phase2_count ]]; then
        # Enhanced verification command detection
        local verification_commands=(
            "(test|check|verify|validate|lint|build|audit)"
            "(npm|yarn|pip|cargo|go) (test|check|audit)"
            "(pytest|jest|mocha|rspec|phpunit)"
            "(eslint|pylint|rubocop|clippy)"
            "(docker|kubectl) (logs|describe|get)"
        )
        
        local is_verification=false
        local verification_type=""
        
        for pattern in "${verification_commands[@]}"; do
            if [[ "$command" =~ $pattern ]] || [[ "$tool_name" == "Bash" && "$command" =~ $pattern ]]; then
                is_verification=true
                if [[ "$command" =~ test ]]; then
                    verification_type="testing"
                elif [[ "$command" =~ (lint|check) ]]; then
                    verification_type="code_quality"
                elif [[ "$command" =~ (build|deploy) ]]; then
                    verification_type="deployment"
                else
                    verification_type="general"
                fi
                break
            fi
        done
        
        if [[ "$is_verification" == true ]]; then
            log_activity "POST_EXECUTION" "Verification activity detected, Phase 3 needed" "command: $command, type: $verification_type"
            
            echo '{
                "decision": "allow",
                "message": "🧪 Verification activities detected. Consider creating Phase 3 documentation to validate and record completion status.",
                "metadata": {
                    "verification_command": "'"$command"'",
                    "verification_type": "'"$verification_type"'",
                    "phase2_docs": '$phase2_count',
                    "phase3_verifications": '$phase3_count',
                    "docs_pending_verification": '$((phase2_count - phase3_count))',
                    "suggestion": "Create verification report in .claude/plans/3_checked_delta_exec_plans/",
                    "cascade_version": "'"$SCRIPT_VERSION"'"
                }
            }'
            return
        fi
    fi
    
    # Default: allow without message
    log $LOG_DEBUG "No phase transition recommendations needed"
    echo '{"decision": "allow"}'
}

# Enhanced phase validation with detailed scoring
validate_phase() {
    local phase="$1"
    local plan_file="$2"
    
    if [[ ! -f "$plan_file" ]]; then
        log_validation "PHASE_$phase" "FAIL" "File does not exist: $plan_file"
        echo '{"valid": false, "reason": "Plan file does not exist", "score": 0}'
        return
    fi
    
    local required_sections
    local section_importance
    local total_score=0
    local max_score=0
    local missing_sections=()
    local found_sections=()
    
    case "$phase" in
        "1")
            required_sections=($(printf '%s\n' "${!PHASE1_REQUIRED_SECTIONS[@]}"))
            ;;
        "2")
            required_sections=($(printf '%s\n' "${!PHASE2_REQUIRED_SECTIONS[@]}"))
            ;;
        "3")
            required_sections=($(printf '%s\n' "${!PHASE3_REQUIRED_SECTIONS[@]}"))
            ;;
        *)
            log_validation "PHASE_$phase" "ERROR" "Unknown phase"
            echo '{"valid": false, "reason": "Unknown phase", "score": 0}'
            return
            ;;
    esac
    
    # Check each required section
    for section in "${required_sections[@]}"; do
        case "$phase" in
            "1") section_importance="${PHASE1_REQUIRED_SECTIONS[$section]}" ;;
            "2") section_importance="${PHASE2_REQUIRED_SECTIONS[$section]}" ;;
            "3") section_importance="${PHASE3_REQUIRED_SECTIONS[$section]}" ;;
        esac
        
        local section_weight
        case "$section_importance" in
            "Essential") section_weight=10; max_score=$((max_score + 10)) ;;
            "Important") section_weight=5; max_score=$((max_score + 5)) ;;
            *) section_weight=1; max_score=$((max_score + 1)) ;;
        esac
        
        if grep -q "## $section" "$plan_file"; then
            found_sections+=("$section")
            total_score=$((total_score + section_weight))
            log $LOG_DEBUG "Found section: $section (weight: $section_weight)"
        else
            missing_sections+=("$section")
            log $LOG_DEBUG "Missing section: $section (weight: $section_weight)"
        fi
    done
    
    # Special validation for Phase 3 - check for actual verification content
    if [[ "$phase" == "3" ]]; then
        if grep -q "**Command/Action:**" "$plan_file" && grep -q "**Actual Result:**" "$plan_file"; then
            total_score=$((total_score + 5))
            max_score=$((max_score + 5))
            log $LOG_DEBUG "Phase 3: Found actual verification tests"
        else
            missing_sections+=("Actual verification tests")
            max_score=$((max_score + 5))
            log $LOG_DEBUG "Phase 3: Missing actual verification tests"
        fi
    fi
    
    # Calculate completion percentage
    local completion_percentage=0
    if [[ $max_score -gt 0 ]]; then
        completion_percentage=$(( (total_score * 100) / max_score ))
    fi
    
    # Determine validation result
    local is_valid=false
    local quality_level="poor"
    
    if [[ $completion_percentage -ge 80 ]]; then
        is_valid=true
        quality_level="excellent"
    elif [[ $completion_percentage -ge 60 ]]; then
        is_valid=true
        quality_level="good"
    elif [[ $completion_percentage -ge 40 ]]; then
        quality_level="fair"
    fi
    
    log_validation "PHASE_$phase" "$([ "$is_valid" == true ] && echo "PASS" || echo "FAIL")" "Score: $total_score/$max_score ($completion_percentage%), Quality: $quality_level"
    
    # Generate detailed response
    local missing_list=""
    if [[ ${#missing_sections[@]} -gt 0 ]]; then
        missing_list=$(IFS=', '; echo "${missing_sections[*]}")
    fi
    
    local found_list=""
    if [[ ${#found_sections[@]} -gt 0 ]]; then
        found_list=$(IFS=', '; echo "${found_sections[*]}")
    fi
    
    echo '{
        "valid": '$([[ "$is_valid" == true ]] && echo "true" || echo "false")',
        "score": '$total_score',
        "max_score": '$max_score',
        "completion_percentage": '$completion_percentage',
        "quality_level": "'"$quality_level"'",
        "found_sections": ["'$(IFS='","'; echo "${found_sections[*]}")'"],
        "missing_sections": ["'$(IFS='","'; echo "${missing_sections[*]}")'"],
        "reason": "'"${missing_list:+Missing sections: $missing_list}"'",
        "cascade_version": "'"$SCRIPT_VERSION"'"
    }'
}

# Enhanced phase transition suggestions with analytics
get_phase_suggestions() {
    local today="${1:-$(date +%Y%m%d)}"
    local phase1_count phase2_count phase3_count
    
    phase1_count=$(get_todays_plans "1_pre_exec_plans" "$today")
    phase2_count=$(get_todays_plans "2_post_exec_plans" "$today")
    phase3_count=$(get_todays_plans "3_checked_delta_exec_plans" "$today")
    
    local suggestions=()
    local priority_suggestions=()
    
    # Analyze phase gaps
    local phase2_gap=$((phase1_count - phase2_count))
    local phase3_gap=$((phase2_count - phase3_count))
    
    if [[ $phase2_gap -gt 0 ]]; then
        if [[ $phase2_gap -gt 2 ]]; then
            priority_suggestions+=("HIGH PRIORITY: $phase2_gap plans need Phase 2 execution documentation")
        else
            suggestions+=("Create Phase 2 documentation for $phase2_gap executed plans")
        fi
    fi
    
    if [[ $phase3_gap -gt 0 ]]; then
        if [[ $phase3_gap -gt 2 ]]; then
            priority_suggestions+=("HIGH PRIORITY: $phase3_gap executions need Phase 3 verification")
        else
            suggestions+=("Create Phase 3 verification for $phase3_gap completed executions")
        fi
    fi
    
    # Output prioritized suggestions
    printf '%s\n' "${priority_suggestions[@]}" "${suggestions[@]}"
}

# Display version and help information
show_version() {
    cat << EOF
$SCRIPT_NAME v$SCRIPT_VERSION
Part of Claude Cascade: Intelligent planning workflows for Claude Code

For more information, visit: https://github.com/claudecascade/claude-cascade
EOF
}

# Main execution with comprehensive command handling
main() {
    if [[ "${1:-}" == "--version" ]]; then
        show_version
        exit 0
    fi
    
    if ! init_state_files; then
        log $LOG_ERROR "Failed to initialize state files"
        echo '{"decision": "allow", "error": "State initialization failed"}'
        exit 1
    fi
    
    case "${1:-}" in
        "post-execution")
            check_post_execution
            ;;
        "verify-phase")
            validate_phase "${2:-}" "${3:-}"
            ;;
        "suggestions")
            get_phase_suggestions "${2:-}"
            ;;
        "analyze-plans")
            analyze_plan_files "${2:-1_pre_exec_plans}" "${3:-}"
            ;;
        *)
            echo '{"decision": "allow", "message": "Claude Cascade Phase Validator: Unknown command '"${1:-}"'"}'
            ;;
    esac
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi