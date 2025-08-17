#!/bin/bash
# pre-action-validator.sh - Validates actions against three-phase planning
# Blocks file operations without proper planning documentation

set -euo pipefail

# Configuration
STRICT_MODE=true  # When true, blocks actions without proper plans
LOG_LEVEL=info    # debug, info, warn, error
COLOR_OUTPUT=true # Use colored output for better visibility

# Constants
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
PLANS_DIR="$PROJECT_DIR/.claude/plans"
PHASE1_DIR="$PLANS_DIR/1_pre_exec_plans"
PHASE2_DIR="$PLANS_DIR/2_post_exec_plans" 
PHASE3_DIR="$PLANS_DIR/3_checked_delta_exec_plans"
LOGS_DIR="$PROJECT_DIR/.claude/logs"
VALIDATION_LOG="$LOGS_DIR/validation.log"
VIOLATION_LOG="$LOGS_DIR/violations.log"
ACTIVE_PLAN_FILE="$SCRIPT_DIR/state/active_plan.txt"
TEMP_DIR="/tmp/claude_cascade"
ACTION_CACHE="$TEMP_DIR/action_cache.json"

# Colors for output
if [ "$COLOR_OUTPUT" = true ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  MAGENTA='\033[0;35m'
  CYAN='\033[0;36m'
  RESET='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  MAGENTA=''
  CYAN=''
  RESET=''
fi

# Initialize directories
mkdir -p "$LOGS_DIR" "$TEMP_DIR" "$(dirname "$ACTIVE_PLAN_FILE")"
touch "$VALIDATION_LOG" "$VIOLATION_LOG"

# Logging function with log levels
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case "$level" in
    debug)
      [[ "$LOG_LEVEL" =~ ^(debug)$ ]] && echo -e "${BLUE}[DEBUG]${RESET} $message"
      ;;
    info)
      [[ "$LOG_LEVEL" =~ ^(debug|info)$ ]] && echo -e "${GREEN}[INFO]${RESET} $message"
      ;;
    warn)
      [[ "$LOG_LEVEL" =~ ^(debug|info|warn)$ ]] && echo -e "${YELLOW}[WARN]${RESET} $message"
      ;;
    error)
      echo -e "${RED}[ERROR]${RESET} $message"
      ;;
    *)
      echo -e "$message"
      ;;
  esac
  
  echo "[$timestamp] [$level] $message" >> "$VALIDATION_LOG"
}

# Log a violation
log_violation() {
  local action="$1"
  local reason="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  echo "[$timestamp] Action: $action, Reason: $reason" >> "$VIOLATION_LOG"
  
  # Display to user
  log error "VIOLATION: $action - $reason"
}

# Check if a file exists in any of the phase directories
find_plan_file() {
  local plan_name="$1"
  
  # Check all phase directories
  find "$PLANS_DIR" -type f -path "*/[123]_*_plans/*" -name "*${plan_name}*" -print -quit
}

# Get current active plan
get_active_plan() {
  if [[ -f "$ACTIVE_PLAN_FILE" ]]; then
    cat "$ACTIVE_PLAN_FILE"
  else
    echo ""
  fi
}

# Set active plan
set_active_plan() {
  local plan_id="$1"
  echo "$plan_id" > "$ACTIVE_PLAN_FILE"
  log info "Set active plan to: $plan_id"
}

# Check if there's a complete Phase 1 plan for the given action
has_phase1_plan() {
  local action_name="$1"
  local plan_files=$(find "$PHASE1_DIR" -type f -name "*.md" | grep -v "TEMPLATE" || true)
  
  if [[ -z "$plan_files" ]]; then
    log warn "No Phase 1 plans found in $PHASE1_DIR"
    return 1
  fi
  
  # Try to find a relevant plan based on keywords in the action
  local keywords
  keywords=$(echo "$action_name" | tr '[:lower:]' '[:upper:]' | tr ' ' '_')
  
  # Check if any plan contains these keywords
  for plan in $plan_files; do
    local plan_basename=$(basename "$plan")
    if echo "$plan_basename" | grep -q -E "$keywords"; then
      log info "Found matching Phase 1 plan: $plan_basename"
      return 0
    fi
  done
  
  log warn "No matching Phase 1 plan found for action: $action_name"
  return 1
}

# Check if all phases are complete for a given plan ID
are_all_phases_complete() {
  local plan_id="$1"
  
  # Check for Phase 1
  local phase1=$(find "$PHASE1_DIR" -name "*${plan_id}*.md" | head -n 1)
  if [[ -z "$phase1" ]]; then
    log warn "Missing Phase 1 plan for $plan_id"
    return 1
  fi
  
  # Check for Phase 2
  local phase2=$(find "$PHASE2_DIR" -name "*${plan_id}*_EXECUTED.md" | head -n 1)
  if [[ -z "$phase2" ]]; then
    log warn "Missing Phase 2 execution report for $plan_id"
    return 1
  fi
  
  # Check for Phase 3
  local phase3=$(find "$PHASE3_DIR" -name "*${plan_id}*_VERIFICATION.md" | head -n 1)
  if [[ -z "$phase3" ]]; then
    log warn "Missing Phase 3 verification for $plan_id"
    return 1
  fi
  
  return 0
}

# Find any incomplete phases
find_incomplete_phases() {
  local incomplete=false
  
  # Get all Phase 1 plans
  local phase1_files=$(find "$PHASE1_DIR" -type f -name "*.md" | grep -v "TEMPLATE" || true)
  
  if [[ -z "$phase1_files" ]]; then
    log info "No Phase 1 plans found - nothing to check"
    return 0
  fi
  
  log debug "Checking for incomplete phases..."
  
  for phase1 in $phase1_files; do
    local basename=$(basename "$phase1")
    local plan_id=$(echo "$basename" | sed -E 's/^([0-9]{8}_[0-9]{6}_[A-Z_]+).*/\1/')
    
    # Skip template files
    if [[ "$basename" == *"TEMPLATE"* ]]; then
      continue
    fi
    
    log debug "Checking phases for plan: $plan_id"
    
    # Check for matching Phase 2
    local phase2=$(find "$PHASE2_DIR" -name "*${plan_id}*_EXECUTED.md" | head -n 1)
    if [[ -z "$phase2" ]]; then
      log warn "❌ Missing Phase 2 for: $basename"
      echo "$plan_id:1:2:$basename"
      incomplete=true
      continue
    fi
    
    # Check for matching Phase 3
    local phase3=$(find "$PHASE3_DIR" -name "*${plan_id}*_VERIFICATION.md" | head -n 1)
    if [[ -z "$phase3" ]]; then
      log warn "❌ Missing Phase 3 for: $basename"
      echo "$plan_id:2:3:$basename"
      incomplete=true
      continue
    fi
    
    log debug "✅ All phases complete for: $basename"
  done
  
  if [[ "$incomplete" = false ]]; then
    log info "✅ All plans have complete phases"
    return 0
  else
    return 1
  fi
}

# Validate an action against planning requirements
validate_action() {
  local action_type="$1"
  local action_target="$2"
  local action_description="$3"
  
  log debug "Validating action: $action_type on $action_target"
  
  # Check for incomplete phases
  local incomplete_phases=$(find_incomplete_phases)
  if [[ -n "$incomplete_phases" ]]; then
    log warn "There are incomplete phases in the project"
    
    if [[ "$STRICT_MODE" = true ]]; then
      log_violation "$action_type:$action_target" "Incomplete phases detected: $incomplete_phases"
      return 1
    fi
  fi
  
  # For file creation/modification, ensure there's a plan
  if [[ "$action_type" == "create" || "$action_type" == "modify" ]]; then
    local action_name="${action_description:-$action_target}"
    
    if ! has_phase1_plan "$action_name"; then
      if [[ "$STRICT_MODE" = true ]]; then
        log_violation "$action_type:$action_target" "No Phase 1 plan found for this action"
        return 1
      else
        log warn "No Phase 1 plan found for this action (continuing in non-strict mode)"
      fi
    fi
  fi
  
  return 0
}

# CLI interface for the validator
main() {
  local action="$1"
  local target="${2:-}"
  local description="${3:-}"
  
  case "$action" in
    create|modify|delete)
      validate_action "$action" "$target" "$description"
      ;;
    context_switch)
      log info "Context switch detected - validating project state"
      find_incomplete_phases
      ;;
    check_plan_status)
      log info "Checking plan status for the project"
      find_incomplete_phases
      ;;
    list_violations)
      if [[ -f "$VIOLATION_LOG" ]]; then
        echo -e "${RED}Recent violations:${RESET}"
        tail -n 10 "$VIOLATION_LOG"
      else
        log info "No violations logged"
      fi
      ;;
    set_active_plan)
      if [[ -n "$target" ]]; then
        set_active_plan "$target"
      else
        log error "No plan ID provided"
        return 1
      fi
      ;;
    get_active_plan)
      get_active_plan
      ;;
    validate_phases)
      log info "Validating all project phases"
      find_incomplete_phases
      ;;
    *)
      echo "Usage: $0 <action> [target] [description]"
      echo "Actions:"
      echo "  create <file_path> [description] - Validate file creation"
      echo "  modify <file_path> [description] - Validate file modification"
      echo "  delete <file_path> [description] - Validate file deletion"
      echo "  context_switch - Validate on context resumption"
      echo "  check_plan_status - Check status of all plans"
      echo "  list_violations - Show recent violations"
      echo "  set_active_plan <plan_id> - Set the current active plan"
      echo "  get_active_plan - Get the current active plan"
      echo "  validate_phases - Check if all phases are complete"
      return 1
      ;;
  esac
}

# Run the main function with all arguments
main "$@"