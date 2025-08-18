# Claude Cascade Validation Scripts

This directory contains Node.js scripts used to validate the three-phase planning workflow in Claude Cascade.

## Overview

These scripts run as part of the GitHub Actions workflows to validate plan documents, provide feedback on PR comments, and ensure all three phases are complete before allowing a PR to be merged.

## Scripts

### validate-phases.js

Main validation script that orchestrates the entire validation process:
- Finds the most recent phase documents
- Validates each phase's content and structure
- Performs cross-phase consistency checks
- Posts validation results as PR comments
- Sets PR labels based on validation status

Usage:
```
node validate-phases.js
```

### check-plan-content.js

Utilities to validate the content quality of phase documents:
- Checks for required sections in each phase
- Validates content quality and structure
- Ensures Phase 1 plan has clear objectives and success criteria
- Ensures Phase 2 execution record documents what was implemented
- Ensures Phase 3 verification includes actual tests and results

### format-report.js

Formats validation results for PR comments:
- Creates Markdown-formatted validation reports
- Highlights issues that need to be addressed
- Provides specific guidance for fixing problems
- Color-coded console output for local development

## Configuration

These scripts are automatically run by the GitHub Actions workflows. No additional configuration is required.

## Running Locally

To run the validation scripts locally:

1. Install dependencies:
```
npm install
```

2. Run the validation:
```
npm run validate
```

## Dependencies

- @actions/core - GitHub Actions core library
- @actions/github - GitHub API integration
- chalk - Console output styling
- front-matter - Markdown front matter parsing
- glob - File pattern matching
- js-yaml - YAML parsing
- markdown-it - Markdown rendering

## Validation Rules

### Phase 1: Pre-Execution Plan

A valid Phase 1 plan must include:
- File named `YYYYMMDD_HHMMSS_PLAN_NAME.md`
- `## Objective` section
- `## Detailed Steps` section
- `## Success Criteria` section
- Sufficient detail (minimum 500 characters)
- Numbered implementation steps
- Measurable success metrics

### Phase 2: Post-Execution Record

A valid Phase 2 execution record must include:
- File named `YYYYMMDD_HHMMSS_PLAN_NAME_EXECUTED.md`
- `## What Was Executed` section
- `## Results Achieved` section
- `## Deviations from Plan` section
- Sufficient detail (minimum 300 characters)
- Structured content (lists or numbered steps)

### Phase 3: Delta Verification

A valid Phase 3 verification must include:
- File named `YYYYMMDD_HHMMSS_PLAN_NAME_VERIFICATION.md`
- `## Verification Tests Performed` section
- `## Success Criteria Assessment` section
- `## Final Status` section
- Specific test commands or procedures
- Expected and actual results
- Clear PASS/FAIL or COMPLETE/INCOMPLETE status

## Adding Custom Validation Rules

To add custom validation rules:

1. Edit the appropriate validation function in `check-plan-content.js`
2. Add new checks and issue messages
3. Make sure any new issues are properly reported in the validation results

## Error Handling

The scripts include robust error handling to prevent crashes:
- File not found errors are properly caught and reported
- Malformed Markdown is handled gracefully
- GitHub API errors are caught and logged
- Process exits with non-zero code when validation fails