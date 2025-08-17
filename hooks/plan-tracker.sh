#!/bin/bash
# plan-tracker.sh - Tracks active plans and compliance reporting
# Provides final checks and compliance statistics

set -euo pipefail

# Ensure required environment variables
CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Constants
HOOKS_DIR="$(dirname "$0")"
STATE_DIR="$HOOKS_DIR/state"
PLANS_DIR="$CLAUDE_PROJECT_DIR/.claude/plans"
ACTIVE_PLANS_FILE="$STATE_DIR/active_plans.json"
PLAN_HISTORY_LOG="$STATE_DIR/plan_history.log"
COMPLIANCE_STATS_FILE="$STATE_DIR/compliance_stats.json"

# Initialize state files if they don't exist
init_state_files() {
    mkdir -p "$STATE_DIR" "$PLANS_DIR"/{1_pre_exec_plans,2_post_exec_plans,3_checked_delta_exec_plans}
    
    if [[ ! -f "$ACTIVE_PLANS_FILE" ]]; then
        echo '{"active_plans": [], "last_updated": ""}' > "$ACTIVE_PLANS_FILE"
    fi
    
    if [[ ! -f "$PLAN_HISTORY_LOG" ]]; then
        touch "$PLAN_HISTORY_LOG"
    fi
    
    if [[ ! -f "$COMPLIANCE_STATS_FILE" ]]; then
        echo '{
            "total_plans": 0,
            "complete_workflows": 0,
            "incomplete_workflows": 0,
            "compliance_rate": 0.0,
            "last_updated": ""
        }' > "$COMPLIANCE_STATS_FILE"
    fi
}

# Log activity to plan history
log_activity() {
    local activity="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $activity" >> "$PLAN_HISTORY_LOG"
}

# Get plan files for a specific date and phase
get_plan_files() {
    local phase="$1"
    local date_pattern="${2:-}"
    
    if [[ -n "$date_pattern" ]]; then
        find "$PLANS_DIR/${phase}" -name "${date_pattern}_*.md" 2>/dev/null | sort
    else
        find "$PLANS_DIR/${phase}" -name "*.md" 2>/dev/null | grep -v TEMPLATE | sort
    fi
}

# Analyze plan completeness
analyze_plan_completeness() {
    local today=$(date +%Y%m%d)
    local phase1_files phase2_files phase3_files
    
    # Get today's plans
    phase1_files=($(get_plan_files "1_pre_exec_plans" "$today"))
    phase2_files=($(get_plan_files "2_post_exec_plans" "$today"))
    phase3_files=($(get_plan_files "3_checked_delta_exec_plans" "$today"))
    
    local incomplete_workflows=()
    local complete_workflows=()
    
    # Check each Phase 1 plan for completion
    if [[ ${#phase1_files[@]} -gt 0 ]]; then
        for phase1_file in "${phase1_files[@]}"; do
            local base_name
            base_name=$(basename "$phase1_file" .md)
            
            # Look for corresponding Phase 2 and 3 files
            local phase2_exists=false
            local phase3_exists=false
            
            if [[ ${#phase2_files[@]} -gt 0 ]]; then
                for phase2_file in "${phase2_files[@]}"; do
                    if [[ "$(basename "$phase2_file")" =~ ${base_name}_EXECUTED\.md$ ]]; then
                        phase2_exists=true
                        break
                    fi
                done
            fi
            
            if [[ ${#phase3_files[@]} -gt 0 ]]; then
                for phase3_file in "${phase3_files[@]}"; do
                    if [[ "$(basename "$phase3_file")" =~ ${base_name}_VERIFICATION\.md$ ]]; then
                        phase3_exists=true
                        break
                    fi
                done
            fi
        
        local status="incomplete"
        local missing_phases=()
        
        if [[ "$phase2_exists" == false ]]; then
            missing_phases+=("Phase 2")
        fi
        
        if [[ "$phase3_exists" == false ]]; then
            missing_phases+=("Phase 3")
        fi
        
        if [[ ${#missing_phases[@]} -eq 0 ]]; then
            status="complete"
            complete_workflows+=("$base_name")
        else
            incomplete_workflows+=("$base_name: missing $(IFS=', '; echo "${missing_phases[*]}")")
        fi
        done
    fi
    
    # Return analysis
    echo "ANALYSIS_RESULTS"
    echo "Complete workflows: ${#complete_workflows[@]}"
    echo "Incomplete workflows: ${#incomplete_workflows[@]}"
    
    if [[ ${#incomplete_workflows[@]} -gt 0 ]]; then
        echo "Incomplete details:"
        printf '  - %s\n' "${incomplete_workflows[@]}"
    fi
    
    if [[ ${#complete_workflows[@]} -gt 0 ]]; then
        echo "Complete workflows:"
        printf '  - %s\n' "${complete_workflows[@]}"
    fi
}

# Update compliance statistics
update_compliance_stats() {
    local today=$(date +%Y%m%d)
    local phase1_count phase2_count phase3_count
    
    phase1_count=$(get_plan_files "1_pre_exec_plans" "$today" | wc -l)
    phase2_count=$(get_plan_files "2_post_exec_plans" "$today" | wc -l)
    phase3_count=$(get_plan_files "3_checked_delta_exec_plans" "$today" | wc -l)
    
    # Calculate complete workflows (minimum of all three phases)
    local complete_workflows
    complete_workflows=$(( phase1_count < phase2_count ? (phase1_count < phase3_count ? phase1_count : phase3_count) : (phase2_count < phase3_count ? phase2_count : phase3_count) ))
    
    local incomplete_workflows
    incomplete_workflows=$(( phase1_count - complete_workflows ))
    
    local compliance_rate=0
    if [[ $phase1_count -gt 0 ]]; then
        compliance_rate=$(echo "scale=2; $complete_workflows * 100 / $phase1_count" | bc -l 2>/dev/null || echo "0")
    fi
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Update stats file
    cat > "$COMPLIANCE_STATS_FILE" << EOF
{
    "total_plans": $phase1_count,
    "complete_workflows": $complete_workflows,
    "incomplete_workflows": $incomplete_workflows,
    "compliance_rate": $compliance_rate,
    "phase_counts": {
        "phase1": $phase1_count,
        "phase2": $phase2_count,
        "phase3": $phase3_count
    },
    "last_updated": "$timestamp"
}
EOF
}

# Final check when session ends
final_check() {
    log_activity "FINAL_CHECK: Session ending, analyzing compliance"
    
    local analysis
    analysis=$(analyze_plan_completeness)
    
    # Update statistics
    update_compliance_stats
    
    # Read current stats
    local compliance_rate
    compliance_rate=$(jq -r '.compliance_rate' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")
    
    local incomplete_count
    incomplete_count=$(jq -r '.incomplete_workflows' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")
    
    # Generate appropriate message based on compliance
    if [[ $(echo "$compliance_rate >= 80" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        echo '{
            "decision": "approve",
            "message": "✅ Excellent planning compliance! Most workflows completed all three phases.",
            "metadata": {
                "compliance_rate": "'$compliance_rate'%",
                "status": "good"
            }
        }'
    elif [[ $incomplete_count -gt 0 ]]; then
        echo '{
            "decision": "approve",
            "message": "📋 Some plans need Phase 2/3 documentation. Consider completing the workflow for better tracking.",
            "metadata": {
                "compliance_rate": "'$compliance_rate'%",
                "incomplete_workflows": '$incomplete_count',
                "status": "needs_improvement"
            }
        }'
    else
        echo '{"decision": "approve"}'
    fi
}

# List all active plans with their status
list_active_plans() {
    local today=$(date +%Y%m%d)
    local all_plans=()
    
    echo "ACTIVE_PLANS_REPORT"
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Get all plans from today
    local phase1_files
    phase1_files=($(get_plan_files "1_pre_exec_plans" "$today"))
    
    if [[ ${#phase1_files[@]} -eq 0 ]]; then
        echo "No active plans found for today."
        return
    fi
    
    echo "Today's Plans Status:"
    echo "===================="
    
    for phase1_file in "${phase1_files[@]}"; do
        local base_name plan_name
        base_name=$(basename "$phase1_file" .md)
        plan_name=$(echo "$base_name" | sed 's/^[0-9]*_[0-9]*_//')
        
        # Check for Phase 2 and 3
        local phase2_file phase3_file
        phase2_file="$PLANS_DIR/2_post_exec_plans/${base_name}_EXECUTED.md"
        phase3_file="$PLANS_DIR/3_checked_delta_exec_plans/${base_name}_VERIFICATION.md"
        
        local status_indicators=""
        local phases_completed=1
        
        if [[ -f "$phase2_file" ]]; then
            status_indicators+=" ✅"
            phases_completed=2
        else
            status_indicators+=" ⏳"
        fi
        
        if [[ -f "$phase3_file" ]]; then
            status_indicators+=" ✅"
            phases_completed=3
        else
            status_indicators+=" ⏳"
        fi
        
        echo "📋 $plan_name"
        echo "   Phases: [✅$status_indicators] ($phases_completed/3 complete)"
        echo ""
    done
}

# Main execution
main() {
    init_state_files
    
    case "${1:-}" in
        "final-check")
            final_check
            ;;
        "list-active")
            list_active_plans
            ;;
        "analyze")
            analyze_plan_completeness
            ;;
        "update-stats")
            update_compliance_stats
            echo "Compliance statistics updated"
            ;;
        *)
            echo '{"decision": "approve", "message": "Plan tracker: Unknown command '$1'"}'
            ;;
    esac
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi