#!/bin/bash
# plan-tracker.sh - Claude Cascade Advanced Plan Tracking & Analytics
# Part of Claude Cascade: Intelligent planning workflows for Claude Code
# https://github.com/claudecascade/claude-cascade

set -euo pipefail

# Version and metadata
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_NAME="Claude Cascade Plan Tracker"

# Environment setup
readonly HOOKS_DIR="$(dirname "$0")"
readonly STATE_DIR="$HOOKS_DIR/../../.claude-cascade/state"
readonly PLANS_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/.claude/plans"
readonly ACTIVE_PLANS_FILE="$STATE_DIR/active_plans.json"
readonly PLAN_HISTORY_LOG="$STATE_DIR/plan_history.log"
readonly COMPLIANCE_STATS_FILE="$STATE_DIR/compliance_stats.json"
readonly ANALYTICS_FILE="$STATE_DIR/analytics.json"

# Color codes for enhanced output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

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

# Initialize comprehensive state files
init_state_files() {
    mkdir -p "$STATE_DIR" "$PLANS_DIR"/{1_pre_exec_plans,2_post_exec_plans,3_checked_delta_exec_plans}
    
    if [[ ! -f "$ACTIVE_PLANS_FILE" ]]; then
        echo '{"active_plans": [], "last_updated": ""}' > "$ACTIVE_PLANS_FILE"
    fi
    
    if [[ ! -f "$PLAN_HISTORY_LOG" ]]; then
        echo "# Claude Cascade Plan History Log" > "$PLAN_HISTORY_LOG"
        echo "# Generated on $(date)" >> "$PLAN_HISTORY_LOG"
    fi
    
    if [[ ! -f "$COMPLIANCE_STATS_FILE" ]]; then
        echo '{
            "total_plans": 0,
            "complete_workflows": 0,
            "incomplete_workflows": 0,
            "compliance_rate": 0.0,
            "phase_counts": {"phase1": 0, "phase2": 0, "phase3": 0},
            "last_updated": "",
            "cascade_version": "'"$SCRIPT_VERSION"'"
        }' > "$COMPLIANCE_STATS_FILE"
    fi
    
    if [[ ! -f "$ANALYTICS_FILE" ]]; then
        echo '{
            "session_analytics": {
                "sessions_tracked": 0,
                "average_completion_rate": 0.0,
                "total_plans_created": 0,
                "productivity_trends": []
            },
            "workflow_analytics": {
                "most_common_keywords": {},
                "average_plan_size": 0,
                "execution_patterns": {},
                "verification_success_rate": 0.0
            },
            "last_updated": "",
            "cascade_version": "'"$SCRIPT_VERSION"'"
        }' > "$ANALYTICS_FILE"
    fi
    
    log $LOG_DEBUG "Advanced plan tracker state files initialized"
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

# Get plan files with enhanced metadata
get_plan_files() {
    local phase="$1"
    local date_pattern="${2:-}"
    
    if [[ -n "$date_pattern" ]]; then
        find "$PLANS_DIR/${phase}" -name "${date_pattern}_*.md" 2>/dev/null | grep -v TEMPLATE | sort
    else
        find "$PLANS_DIR/${phase}" -name "*.md" 2>/dev/null | grep -v TEMPLATE | sort
    fi
}

# Enhanced plan analysis with metadata extraction
analyze_plan_metadata() {
    local plan_file="$1"
    
    if [[ ! -f "$plan_file" ]]; then
        echo "{}"
        return
    fi
    
    local word_count=$(wc -w < "$plan_file" 2>/dev/null || echo 0)
    local line_count=$(wc -l < "$plan_file" 2>/dev/null || echo 0)
    local creation_time=$(stat -f "%m" "$plan_file" 2>/dev/null || stat -c "%Y" "$plan_file" 2>/dev/null || echo "0")
    local modification_time=$(stat -f "%c" "$plan_file" 2>/dev/null || stat -c "%Z" "$plan_file" 2>/dev/null || echo "0")
    
    # Extract plan priority if present
    local priority=$(grep -i "priority:" "$plan_file" | head -1 | sed 's/.*priority:[[:space:]]*\([^[:space:]]*\).*/\1/i' || echo "normal")
    
    # Extract estimated duration if present  
    local duration=$(grep -i "estimated duration:" "$plan_file" | head -1 | sed 's/.*estimated duration:[[:space:]]*\([^[:space:]]*\).*/\1/i' || echo "unknown")
    
    # Count success criteria
    local success_criteria_count=0
    if grep -q "## Success Criteria" "$plan_file"; then
        success_criteria_count=$(sed -n '/## Success Criteria/,/^## /p' "$plan_file" | grep -c "^- \[" || echo 0)
    fi
    
    echo "{
        \"word_count\": $word_count,
        \"line_count\": $line_count,
        \"creation_time\": $creation_time,
        \"modification_time\": $modification_time,
        \"priority\": \"$priority\",
        \"estimated_duration\": \"$duration\",
        \"success_criteria_count\": $success_criteria_count
    }"
}

# Comprehensive plan completeness analysis
analyze_plan_completeness() {
    local date_filter="${1:-$(date +%Y%m%d)}"
    local include_analytics="${2:-false}"
    
    log $LOG_INFO "Analyzing plan completeness for date: $date_filter"
    
    # Get plan files for analysis
    local phase1_files=($(get_plan_files "1_pre_exec_plans" "$date_filter"))
    local phase2_files=($(get_plan_files "2_post_exec_plans" "$date_filter"))  
    local phase3_files=($(get_plan_files "3_checked_delta_exec_plans" "$date_filter"))
    
    local incomplete_workflows=()
    local complete_workflows=()
    local workflow_details=()
    
    # Enhanced workflow analysis
    for phase1_file in "${phase1_files[@]}"; do
        local base_name=$(basename "$phase1_file" .md)
        local plan_name=$(echo "$base_name" | sed 's/^[0-9]*_[0-9]*_//')
        
        # Find corresponding Phase 2 and 3 files with fuzzy matching
        local phase2_exists=false
        local phase3_exists=false
        local phase2_file="" 
        local phase3_file=""
        
        # Look for Phase 2 files
        for candidate in "${phase2_files[@]}"; do
            if [[ "$(basename "$candidate")" =~ ${base_name}_EXECUTED\.md$ ]] ||
               [[ "$(basename "$candidate")" =~ ${plan_name}.*_EXECUTED\.md$ ]]; then
                phase2_exists=true
                phase2_file="$candidate"
                break
            fi
        done
        
        # Look for Phase 3 files
        for candidate in "${phase3_files[@]}"; do
            if [[ "$(basename "$candidate")" =~ ${base_name}_VERIFICATION\.md$ ]] ||
               [[ "$(basename "$candidate")" =~ ${plan_name}.*_VERIFICATION\.md$ ]]; then
                phase3_exists=true
                phase3_file="$candidate"
                break
            fi
        done
        
        # Analyze completeness and quality
        local status="incomplete"
        local missing_phases=()
        local workflow_score=33  # Base score for Phase 1
        
        if [[ "$phase2_exists" == false ]]; then
            missing_phases+=("Phase 2 (Execution)")
        else
            workflow_score=$((workflow_score + 33))
        fi
        
        if [[ "$phase3_exists" == false ]]; then
            missing_phases+=("Phase 3 (Verification)")
        else
            workflow_score=$((workflow_score + 34))
        fi
        
        # Extract metadata for analytics
        local phase1_metadata=""
        local phase2_metadata=""
        local phase3_metadata=""
        
        if [[ "$include_analytics" == "true" ]]; then
            phase1_metadata=$(analyze_plan_metadata "$phase1_file")
            [[ -n "$phase2_file" ]] && phase2_metadata=$(analyze_plan_metadata "$phase2_file")
            [[ -n "$phase3_file" ]] && phase3_metadata=$(analyze_plan_metadata "$phase3_file")
        fi
        
        if [[ ${#missing_phases[@]} -eq 0 ]]; then
            status="complete"
            complete_workflows+=("$plan_name")
            workflow_details+=("✅ $plan_name (Score: $workflow_score/100)")
        else
            incomplete_workflows+=("$plan_name: missing $(IFS=', '; echo "${missing_phases[*]}")")
            workflow_details+=("⚠️  $plan_name (Score: $workflow_score/100) - Missing: $(IFS=', '; echo "${missing_phases[*]}")")
        fi
    done
    
    # Generate comprehensive analysis report
    echo "DETAILED_WORKFLOW_ANALYSIS"
    echo "=========================="
    echo "Analysis Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Filter: $date_filter"
    echo ""
    
    echo "📊 SUMMARY STATISTICS"
    echo "Complete workflows: ${#complete_workflows[@]}"
    echo "Incomplete workflows: ${#incomplete_workflows[@]}"
    echo "Total workflows analyzed: ${#phase1_files[@]}"
    
    if [[ ${#phase1_files[@]} -gt 0 ]]; then
        local completion_rate=$(( ${#complete_workflows[@]} * 100 / ${#phase1_files[@]} ))
        echo "Completion rate: $completion_rate%"
    fi
    
    echo ""
    echo "📋 WORKFLOW DETAILS"
    echo "=================="
    
    if [[ ${#workflow_details[@]} -gt 0 ]]; then
        printf '%s\n' "${workflow_details[@]}"
    else
        echo "No workflows found for the specified date."
    fi
    
    echo ""
    echo "🔍 PHASE DISTRIBUTION"
    echo "===================="
    echo "Phase 1 (Planning): ${#phase1_files[@]} files"
    echo "Phase 2 (Execution): ${#phase2_files[@]} files"
    echo "Phase 3 (Verification): ${#phase3_files[@]} files"
    
    # Recommendations
    echo ""
    echo "💡 RECOMMENDATIONS"
    echo "=================="
    
    local phase2_gap=$((${#phase1_files[@]} - ${#phase2_files[@]}))
    local phase3_gap=$((${#phase2_files[@]} - ${#phase3_files[@]}))
    
    if [[ $phase2_gap -gt 0 ]]; then
        echo "• Create $phase2_gap Phase 2 execution documentation files"
    fi
    
    if [[ $phase3_gap -gt 0 ]]; then
        echo "• Create $phase3_gap Phase 3 verification documentation files"
    fi
    
    if [[ $phase2_gap -eq 0 && $phase3_gap -eq 0 ]]; then
        echo "• Excellent! All workflows are properly documented through all phases"
    fi
}

# Advanced compliance statistics with trend analysis
update_compliance_stats() {
    local date_filter="${1:-$(date +%Y%m%d)}"
    
    log $LOG_INFO "Updating compliance statistics for: $date_filter"
    
    local phase1_count phase2_count phase3_count
    phase1_count=$(get_plan_files "1_pre_exec_plans" "$date_filter" | wc -l)
    phase2_count=$(get_plan_files "2_post_exec_plans" "$date_filter" | wc -l)
    phase3_count=$(get_plan_files "3_checked_delta_exec_plans" "$date_filter" | wc -l)
    
    # Calculate workflow completion metrics
    local complete_workflows=0
    local incomplete_workflows=0
    
    if [[ $phase1_count -gt 0 ]]; then
        # Count actually complete workflows (have all 3 phases)
        complete_workflows=$(( phase1_count < phase2_count ? (phase1_count < phase3_count ? phase1_count : phase3_count) : (phase2_count < phase3_count ? phase2_count : phase3_count) ))
        incomplete_workflows=$(( phase1_count - complete_workflows ))
    fi
    
    # Calculate various compliance rates
    local overall_compliance_rate=0
    local phase2_compliance_rate=0
    local phase3_compliance_rate=0
    
    if [[ $phase1_count -gt 0 ]]; then
        overall_compliance_rate=$(echo "scale=2; $complete_workflows * 100 / $phase1_count" | bc -l 2>/dev/null || echo "0")
        phase2_compliance_rate=$(echo "scale=2; $phase2_count * 100 / $phase1_count" | bc -l 2>/dev/null || echo "0")
    fi
    
    if [[ $phase2_count -gt 0 ]]; then
        phase3_compliance_rate=$(echo "scale=2; $phase3_count * 100 / $phase2_count" | bc -l 2>/dev/null || echo "0")
    fi
    
    # Calculate quality metrics
    local avg_workflow_score=0
    if [[ $phase1_count -gt 0 ]]; then
        local total_score=$(( (phase1_count * 33) + (phase2_count * 33) + (phase3_count * 34) ))
        local max_possible_score=$(( phase1_count * 100 ))
        avg_workflow_score=$(echo "scale=2; $total_score * 100 / $max_possible_score" | bc -l 2>/dev/null || echo "0")
    fi
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local iso_timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    # Generate comprehensive statistics
    cat > "$COMPLIANCE_STATS_FILE" << EOF
{
    "date_analyzed": "$date_filter",
    "analysis_timestamp": "$iso_timestamp",
    "total_plans": $phase1_count,
    "complete_workflows": $complete_workflows,
    "incomplete_workflows": $incomplete_workflows,
    "overall_compliance_rate": $overall_compliance_rate,
    "phase_compliance": {
        "phase2_rate": $phase2_compliance_rate,
        "phase3_rate": $phase3_compliance_rate
    },
    "phase_counts": {
        "phase1": $phase1_count,
        "phase2": $phase2_count,
        "phase3": $phase3_count
    },
    "quality_metrics": {
        "average_workflow_score": $avg_workflow_score,
        "workflow_distribution": {
            "complete_3_phase": $complete_workflows,
            "partial_2_phase": $(( phase2_count - complete_workflows )),
            "partial_1_phase": $(( phase1_count - phase2_count ))
        }
    },
    "last_updated": "$timestamp",
    "cascade_version": "$SCRIPT_VERSION"
}
EOF
    
    log $LOG_INFO "Compliance statistics updated: $overall_compliance_rate% completion rate"
}

# Enhanced final check with detailed reporting
final_check() {
    log_activity "FINAL_CHECK" "Session ending, performing comprehensive analysis"
    
    local today=$(date +%Y%m%d)
    
    # Update all statistics
    update_compliance_stats "$today"
    
    # Read current statistics
    local compliance_rate incomplete_count
    compliance_rate=$(jq -r '.overall_compliance_rate' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")
    incomplete_count=$(jq -r '.incomplete_workflows' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")
    
    # Get workflow quality assessment
    local avg_score
    avg_score=$(jq -r '.quality_metrics.average_workflow_score' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")
    
    # Determine session quality and generate appropriate message
    local quality_assessment="needs_improvement"
    local session_message=""
    local emoji="📋"
    
    if [[ $(echo "$compliance_rate >= 90" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        quality_assessment="excellent"
        emoji="🏆"
        session_message="Outstanding planning compliance! You're setting a great example for systematic development."
    elif [[ $(echo "$compliance_rate >= 75" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        quality_assessment="good"
        emoji="✅" 
        session_message="Excellent planning compliance! Most workflows completed all three phases."
    elif [[ $(echo "$compliance_rate >= 50" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        quality_assessment="fair"
        emoji="⚡"
        session_message="Good progress on planning workflows. Consider completing remaining Phase 2/3 documentation."
    elif [[ $incomplete_count -gt 0 ]]; then
        emoji="📋"
        session_message="Some plans need Phase 2/3 documentation. Consider completing the workflow for better tracking and team coordination."
    else
        # No workflows detected
        echo '{"decision": "allow"}'
        return
    fi
    
    # Generate comprehensive final report
    echo '{
        "decision": "allow",
        "message": "'"$emoji $session_message"'",
        "metadata": {
            "compliance_rate": "'"$compliance_rate"'%",
            "incomplete_workflows": '$incomplete_count',
            "quality_assessment": "'"$quality_assessment"'",
            "average_workflow_score": "'"$avg_score"'%",
            "session_summary": {
                "total_workflows_analyzed": '$(jq -r '.total_plans' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")',
                "complete_workflows": '$(jq -r '.complete_workflows' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")'
            },
            "cascade_version": "'"$SCRIPT_VERSION"'"
        }
    }'
}

# Enhanced active plans listing with rich formatting
list_active_plans() {
    local date_filter="${1:-$(date +%Y%m%d)}"
    local format="${2:-detailed}"
    
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                            📋 CLAUDE CASCADE ACTIVE PLANS                       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Analysis Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BLUE}Filter: $date_filter${NC}"
    echo ""
    
    # Get today's plans
    local phase1_files=($(get_plan_files "1_pre_exec_plans" "$date_filter"))
    
    if [[ ${#phase1_files[@]} -eq 0 ]]; then
        echo -e "${YELLOW}No active plans found for the specified date.${NC}"
        echo ""
        echo -e "${CYAN}💡 To create a new plan:${NC}"
        echo -e "${CYAN}   Use format: YYYYMMDD_HHMMSS_DESCRIPTIVE_NAME.md${NC}"
        echo -e "${CYAN}   Save to: .claude/plans/1_pre_exec_plans/${NC}"
        return
    fi
    
    echo -e "${GREEN}📊 WORKFLOW STATUS OVERVIEW${NC}"
    echo -e "${GREEN}═══════════════════════════${NC}"
    echo ""
    
    local total_score=0
    local max_possible_score=0
    
    for phase1_file in "${phase1_files[@]}"; do
        local base_name=$(basename "$phase1_file" .md)
        local plan_name=$(echo "$base_name" | sed 's/^[0-9]*_[0-9]*_//' | tr '_' ' ')
        
        # Find corresponding files
        local phase2_file=""
        local phase3_file=""
        local phase2_exists=false
        local phase3_exists=false
        
        # Check for Phase 2 file
        local phase2_pattern="${base_name}_EXECUTED.md"
        if [[ -f "$PLANS_DIR/2_post_exec_plans/$phase2_pattern" ]]; then
            phase2_exists=true
            phase2_file="$PLANS_DIR/2_post_exec_plans/$phase2_pattern"
        fi
        
        # Check for Phase 3 file
        local phase3_pattern="${base_name}_VERIFICATION.md"
        if [[ -f "$PLANS_DIR/3_checked_delta_exec_plans/$phase3_pattern" ]]; then
            phase3_exists=true
            phase3_file="$PLANS_DIR/3_checked_delta_exec_plans/$phase3_pattern"
        fi
        
        # Calculate workflow score
        local workflow_score=33
        max_possible_score=$((max_possible_score + 100))
        
        local status_indicators="[${GREEN}✅${NC}"
        
        if [[ "$phase2_exists" == true ]]; then
            status_indicators+=" ${GREEN}✅${NC}"
            workflow_score=$((workflow_score + 33))
        else
            status_indicators+=" ${YELLOW}⏳${NC}"
        fi
        
        if [[ "$phase3_exists" == true ]]; then
            status_indicators+=" ${GREEN}✅${NC}"
            workflow_score=$((workflow_score + 34))
        else
            status_indicators+=" ${YELLOW}⏳${NC}"
        fi
        
        status_indicators+="]"
        total_score=$((total_score + workflow_score))
        
        # Extract priority and duration if available
        local priority_info=""
        local duration_info=""
        
        if [[ "$format" == "detailed" ]]; then
            local priority=$(grep -i "priority:" "$phase1_file" | head -1 | sed 's/.*priority:[[:space:]]*\([^[:space:]]*\).*/\1/i' 2>/dev/null || echo "")
            local duration=$(grep -i "estimated duration:" "$phase1_file" | head -1 | sed 's/.*estimated duration:[[:space:]]*\([^[:space:]]*\).*/\1/i' 2>/dev/null || echo "")
            
            [[ -n "$priority" ]] && priority_info=" ${PURPLE}[Priority: $priority]${NC}"
            [[ -n "$duration" ]] && duration_info=" ${CYAN}[Est: $duration]${NC}"
        fi
        
        # Display workflow information
        echo -e "${BLUE}📋 $plan_name${NC}$priority_info$duration_info"
        echo -e "   Phases: $status_indicators (Score: ${workflow_score}/100)"
        
        if [[ "$format" == "detailed" ]]; then
            local creation_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$phase1_file" 2>/dev/null || stat -c "%y" "$phase1_file" 2>/dev/null | cut -d'.' -f1 || echo "Unknown")
            echo -e "   ${CYAN}Created: $creation_time${NC}"
            
            # Show file links for completed phases
            [[ "$phase2_exists" == true ]] && echo -e "   ${GREEN}Phase 2: $(basename "$phase2_file")${NC}"
            [[ "$phase3_exists" == true ]] && echo -e "   ${GREEN}Phase 3: $(basename "$phase3_file")${NC}"
        fi
        
        echo ""
    done
    
    # Overall statistics
    local overall_score=0
    if [[ $max_possible_score -gt 0 ]]; then
        overall_score=$(echo "scale=1; $total_score * 100 / $max_possible_score" | bc -l 2>/dev/null || echo "0")
    fi
    
    echo -e "${GREEN}📈 SESSION STATISTICS${NC}"
    echo -e "${GREEN}═══════════════════════${NC}"
    echo -e "Total workflows: ${#phase1_files[@]}"
    echo -e "Overall completion: ${overall_score}%"
    
    # Performance indicator
    if [[ $(echo "$overall_score >= 80" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        echo -e "${GREEN}🏆 Excellent workflow compliance!${NC}"
    elif [[ $(echo "$overall_score >= 60" | bc -l 2>/dev/null || echo "0") -eq 1 ]]; then
        echo -e "${YELLOW}⚡ Good progress, consider completing remaining phases${NC}"
    else
        echo -e "${RED}📋 Opportunity for improvement in workflow completion${NC}"
    fi
    
    echo ""
}

# Generate detailed analytics report
generate_analytics_report() {
    local days_back="${1:-7}"
    
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                         📊 CLAUDE CASCADE ANALYTICS REPORT                      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    local total_workflows=0
    local total_complete=0
    local daily_stats=()
    
    # Analyze last N days
    for ((i=0; i<days_back; i++)); do
        local check_date=$(date -d "$i days ago" +%Y%m%d 2>/dev/null || date -v-${i}d +%Y%m%d 2>/dev/null || date +%Y%m%d)
        
        local day_phase1=$(get_plan_files "1_pre_exec_plans" "$check_date" | wc -l)
        local day_phase2=$(get_plan_files "2_post_exec_plans" "$check_date" | wc -l)
        local day_phase3=$(get_plan_files "3_checked_delta_exec_plans" "$check_date" | wc -l)
        
        if [[ $day_phase1 -gt 0 ]]; then
            local day_complete=$(( day_phase1 < day_phase2 ? (day_phase1 < day_phase3 ? day_phase1 : day_phase3) : (day_phase2 < day_phase3 ? day_phase2 : day_phase3) ))
            local day_rate=0
            if [[ $day_phase1 -gt 0 ]]; then
                day_rate=$(echo "scale=1; $day_complete * 100 / $day_phase1" | bc -l 2>/dev/null || echo "0")
            fi
            
            daily_stats+=("$(date -d "$i days ago" +%m-%d 2>/dev/null || date -v-${i}d +%m-%d 2>/dev/null || date +%m-%d): $day_phase1 plans, ${day_rate}% complete")
            total_workflows=$((total_workflows + day_phase1))
            total_complete=$((total_complete + day_complete))
        fi
    done
    
    # Overall trend analysis
    local overall_rate=0
    if [[ $total_workflows -gt 0 ]]; then
        overall_rate=$(echo "scale=1; $total_complete * 100 / $total_workflows" | bc -l 2>/dev/null || echo "0")
    fi
    
    echo -e "${GREEN}📈 TREND ANALYSIS (Last $days_back days)${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "Total workflows: $total_workflows"
    echo -e "Complete workflows: $total_complete"
    echo -e "Average completion rate: ${overall_rate}%"
    echo ""
    
    if [[ ${#daily_stats[@]} -gt 0 ]]; then
        echo -e "${BLUE}📅 DAILY BREAKDOWN${NC}"
        echo -e "${BLUE}═════════════════${NC}"
        printf '%s\n' "${daily_stats[@]}"
    else
        echo -e "${YELLOW}No workflow data found for the last $days_back days.${NC}"
    fi
    
    echo ""
}

# Display version and help information
show_version() {
    cat << EOF
$SCRIPT_NAME v$SCRIPT_VERSION
Part of Claude Cascade: Intelligent planning workflows for Claude Code

For more information, visit: https://github.com/claudecascade/claude-cascade
EOF
}

# Main execution with comprehensive command support
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
        "final-check")
            final_check
            ;;
        "list-active"|"list")
            list_active_plans "${2:-}" "${3:-detailed}"
            ;;
        "analyze"|"analysis")
            analyze_plan_completeness "${2:-}" "${3:-false}"
            ;;
        "update-stats"|"stats")
            update_compliance_stats "${2:-}"
            echo "Compliance statistics updated successfully"
            ;;
        "analytics"|"report")
            generate_analytics_report "${2:-7}"
            ;;
        "summary")
            echo ""
            echo "📊 QUICK SUMMARY"
            echo "================"
            update_compliance_stats
            local rate=$(jq -r '.overall_compliance_rate' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")
            local total=$(jq -r '.total_plans' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")
            local complete=$(jq -r '.complete_workflows' "$COMPLIANCE_STATS_FILE" 2>/dev/null || echo "0")
            echo "Workflows today: $total"
            echo "Complete workflows: $complete"
            echo "Completion rate: ${rate}%"
            echo ""
            ;;
        *)
            echo '{"decision": "allow", "message": "Claude Cascade Plan Tracker: Unknown command '"${1:-}"'"}'
            ;;
    esac
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi