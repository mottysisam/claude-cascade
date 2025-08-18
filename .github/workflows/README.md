# Claude Cascade GitHub Actions Workflows

This directory contains the GitHub Actions workflows that enforce the three-phase planning system in Claude Cascade.

## Overview

The Claude Cascade Three-Phase Planning Workflow is enforced through a series of GitHub Actions that validate plans, execution records, and verifications to ensure a complete and thorough development process.

## Workflows

### 1. `cascade-enforcement.yml`

**Purpose**: Main enforcement workflow that checks for the presence and structure of all three phases.

**Triggers**:
- Pull request events (open, sync, reopen, edit)
- Push events (except dependabot branches)
- Manual workflow dispatch

**Key Features**:
- Detects presence of Phase 1, 2, and 3 files
- Generates comprehensive phase status reports
- Comments on PRs with status information
- Creates GitHub status checks for each phase

### 2. `phase-1-validator.yml`

**Purpose**: Validates the structure and content of Phase 1 pre-execution plans.

**Triggers**:
- Pull request events that modify files in `.claude/plans/1_pre_exec_plans/`
- Push events that modify files in `.claude/plans/1_pre_exec_plans/`
- Manual workflow dispatch

**Key Features**:
- Validates required sections (Objective, Detailed Steps, Success Criteria)
- Checks for implementation steps
- Looks for measurable metrics in success criteria
- Comments on PRs with validation results

### 3. `phase-2-validator.yml`

**Purpose**: Validates the structure and content of Phase 2 post-execution records.

**Triggers**:
- Pull request events that modify files in `.claude/plans/2_post_exec_plans/`
- Push events that modify files in `.claude/plans/2_post_exec_plans/`
- Manual workflow dispatch

**Key Features**:
- Validates required sections (What Was Executed, Results Achieved, Deviations from Plan)
- Checks for commit references
- Compares execution record with original plan
- Comments on PRs with validation results

### 4. `phase-3-validator.yml`

**Purpose**: Validates the structure and content of Phase 3 delta verifications.

**Triggers**:
- Pull request events that modify files in `.claude/plans/3_checked_delta_exec_plans/`
- Push events that modify files in `.claude/plans/3_checked_delta_exec_plans/`
- Manual workflow dispatch

**Key Features**:
- Validates required sections (Verification Tests Performed, Success Criteria Assessment, Final Status)
- Checks for actual verification test commands and results
- Verifies success criteria assessment against original plan
- Comments on PRs with validation results

### 5. `pr-merge-guardian.yml`

**Purpose**: Protects PR merges by ensuring all three phases are complete.

**Triggers**:
- Pull request events (open, sync, reopen, ready for review)
- Pull request target events (labeled)
- Check suite completion
- Manual workflow dispatch

**Key Features**:
- Generates comprehensive compliance reports
- Sets PR status checks for all phases
- Adds and manages PR labels (cascade:ready-to-merge, cascade:incomplete)
- Blocks merges until all phases are complete

## Custom Actions

### `plan-parser`

**Purpose**: Extracts metadata and content from Claude Cascade plans.

**Inputs**:
- `plan_file`: Path to the plan file to parse

**Outputs**:
- Plan metadata (title, date, time, name)
- Plan sections (objective, context, detailed steps, etc.)
- Analysis of plan content (has_metrics, etc.)

## Usage

These workflows run automatically when PRs are created or updated and when plan files are modified. You can also trigger them manually from the GitHub Actions tab.

## Manual Workflow Triggers

### Manually Validate a Plan

1. Go to the Actions tab in your repository
2. Select the appropriate workflow (e.g., "Phase 1 Plan Validation")
3. Click "Run workflow"
4. Enter the path to the plan file to validate
5. Click "Run workflow"

### Check PR Compliance

1. Go to the Actions tab in your repository
2. Select "PR Merge Guardian"
3. Click "Run workflow"
4. Enter the PR number to check
5. Click "Run workflow"

## Workflow Configuration

These workflows are designed to work with the default Claude Cascade directory structure:

```
.claude/
└── plans/
    ├── 1_pre_exec_plans/
    ├── 2_post_exec_plans/
    └── 3_checked_delta_exec_plans/
```

File naming conventions:
- Phase 1: `YYYYMMDD_HHMMSS_PLAN_NAME.md`
- Phase 2: `YYYYMMDD_HHMMSS_PLAN_NAME_EXECUTED.md`
- Phase 3: `YYYYMMDD_HHMMSS_PLAN_NAME_VERIFICATION.md`

## Customizing the Workflows

You can customize these workflows by editing the YAML files in this directory. Common customizations include:

- Adjusting validation criteria
- Modifying required sections
- Changing status check names
- Adjusting thresholds for pass/fail conditions