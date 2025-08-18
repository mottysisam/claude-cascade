/**
 * Validate-Phases.js - Main validation script for Claude Cascade three-phase workflow
 * 
 * This script checks if all three phases are complete and valid, providing
 * detailed feedback on any issues found. It's designed to run in GitHub Actions
 * and post results as PR comments.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const core = require('@actions/core');
const github = require('@actions/github');
const { formatReport, logReport } = require('./format-report');
const { 
  validatePhase1Plan,
  validatePhase2Record,
  validatePhase3Verification,
  validateCrossPhaseConsistency,
  extractPlanNameFromPath
} = require('./check-plan-content');

// Constants
const CLAUDE_DIR = '.claude';
const PLANS_DIR = path.join(CLAUDE_DIR, 'plans');
const PHASE1_DIR = path.join(PLANS_DIR, '1_pre_exec_plans');
const PHASE2_DIR = path.join(PLANS_DIR, '2_post_exec_plans');
const PHASE3_DIR = path.join(PLANS_DIR, '3_checked_delta_exec_plans');

/**
 * Main validation function
 * 
 * @returns {Object} Validation results
 */
async function validatePhases() {
  // Initialize results structure
  const results = {
    isValid: false,
    phases: {
      phase1: { exists: false, isValid: false, issues: [] },
      phase2: { exists: false, isValid: false, issues: [] },
      phase3: { exists: false, isValid: false, issues: [] }
    }
  };
  
  try {
    // Check if .claude directory structure exists
    if (!fs.existsSync(CLAUDE_DIR) || !fs.existsSync(PLANS_DIR)) {
      results.phases.phase1.issues.push('.claude/plans directory structure not found');
      return results;
    }
    
    // Find the most recent plan files for each phase
    const phase1File = findMostRecentPhaseFile(PHASE1_DIR, '.md');
    const phase2File = findMostRecentPhaseFile(PHASE2_DIR, '_EXECUTED.md');
    const phase3File = findMostRecentPhaseFile(PHASE3_DIR, '_VERIFICATION.md');
    
    // Validate Phase 1
    if (phase1File) {
      results.phases.phase1.exists = true;
      results.phases.phase1.filePath = phase1File;
      
      const phase1Validation = validatePhase1Plan(phase1File);
      results.phases.phase1.isValid = phase1Validation.isValid;
      results.phases.phase1.issues = phase1Validation.issues;
    } else {
      results.phases.phase1.issues.push('No Phase 1 plan found in .claude/plans/1_pre_exec_plans/');
    }
    
    // Validate Phase 2
    if (phase2File) {
      results.phases.phase2.exists = true;
      results.phases.phase2.filePath = phase2File;
      
      const phase2Validation = validatePhase2Record(phase2File);
      results.phases.phase2.isValid = phase2Validation.isValid;
      results.phases.phase2.issues = phase2Validation.issues;
    } else if (results.phases.phase1.exists) {
      results.phases.phase2.issues.push('No Phase 2 execution record found in .claude/plans/2_post_exec_plans/');
    }
    
    // Validate Phase 3
    if (phase3File) {
      results.phases.phase3.exists = true;
      results.phases.phase3.filePath = phase3File;
      
      const phase3Validation = validatePhase3Verification(phase3File);
      results.phases.phase3.isValid = phase3Validation.isValid;
      results.phases.phase3.issues = phase3Validation.issues;
    } else if (results.phases.phase2.exists) {
      results.phases.phase3.issues.push('No Phase 3 verification found in .claude/plans/3_checked_delta_exec_plans/');
    }
    
    // Cross-phase validation if all phases exist
    if (results.phases.phase1.exists && results.phases.phase2.exists && results.phases.phase3.exists) {
      const crossPhaseValidation = validateCrossPhaseConsistency(phase1File, phase2File, phase3File);
      
      if (!crossPhaseValidation.isValid) {
        // Add cross-phase issues to all affected phases
        crossPhaseValidation.issues.forEach(issue => {
          if (issue.includes('Phase 2')) {
            results.phases.phase2.issues.push(issue);
            results.phases.phase2.isValid = false;
          } else if (issue.includes('Phase 3')) {
            results.phases.phase3.issues.push(issue);
            results.phases.phase3.isValid = false;
          } else {
            // Add general issues to all phases
            results.phases.phase1.issues.push(issue);
            results.phases.phase2.issues.push(issue);
            results.phases.phase3.issues.push(issue);
            results.phases.phase1.isValid = false;
            results.phases.phase2.isValid = false;
            results.phases.phase3.isValid = false;
          }
        });
      }
    }
    
    // Overall validity check - all phases must be valid
    results.isValid = results.phases.phase1.isValid && 
                      results.phases.phase2.isValid && 
                      results.phases.phase3.isValid;
    
    return results;
  } catch (error) {
    console.error('Error validating phases:', error);
    results.phases.phase1.issues.push(`Validation error: ${error.message}`);
    return results;
  }
}

/**
 * Find the most recent file in a directory matching a suffix
 * 
 * @param {string} directory - Directory to search
 * @param {string} suffix - File suffix to match
 * @returns {string|null} File path or null if not found
 */
function findMostRecentPhaseFile(directory, suffix) {
  if (!fs.existsSync(directory)) {
    return null;
  }
  
  try {
    const files = fs.readdirSync(directory)
      .filter(file => file.endsWith(suffix) && !file.startsWith('.'))
      .map(file => ({
        name: file,
        path: path.join(directory, file),
        time: fs.statSync(path.join(directory, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by most recent
    
    return files.length > 0 ? files[0].path : null;
  } catch (error) {
    console.error(`Error finding files in ${directory}:`, error);
    return null;
  }
}

/**
 * Post validation results to PR as a comment
 * 
 * @param {Object} validationResults - Results of the validation
 */
async function postResultsToPR(validationResults) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN not provided');
    }
    
    const octokit = github.getOctokit(token);
    const context = github.context;
    
    // Only post comment if running in a PR context
    if (!context.payload.pull_request) {
      console.log('Not running in PR context, skipping PR comment');
      return;
    }
    
    const reportBody = formatReport(validationResults);
    
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: context.payload.pull_request.number,
      body: reportBody
    });
    
    console.log('Posted validation report to PR');
    
    // Set PR labels based on validation result
    if (validationResults.isValid) {
      // Try to add the ready-to-merge label
      try {
        await octokit.rest.issues.addLabels({
          ...context.repo,
          issue_number: context.payload.pull_request.number,
          labels: ['cascade:ready-to-merge']
        });
        
        // Try to remove incomplete label if it exists
        try {
          await octokit.rest.issues.removeLabel({
            ...context.repo,
            issue_number: context.payload.pull_request.number,
            name: 'cascade:incomplete'
          });
        } catch (error) {
          // Ignore error if label doesn't exist
        }
      } catch (error) {
        console.error('Error setting PR labels:', error);
      }
    } else {
      // Try to add the incomplete label
      try {
        await octokit.rest.issues.addLabels({
          ...context.repo,
          issue_number: context.payload.pull_request.number,
          labels: ['cascade:incomplete']
        });
        
        // Try to remove ready-to-merge label if it exists
        try {
          await octokit.rest.issues.removeLabel({
            ...context.repo,
            issue_number: context.payload.pull_request.number,
            name: 'cascade:ready-to-merge'
          });
        } catch (error) {
          // Ignore error if label doesn't exist
        }
      } catch (error) {
        console.error('Error setting PR labels:', error);
      }
    }
  } catch (error) {
    console.error('Error posting results to PR:', error);
  }
}

// Run the validation when this script is executed directly
if (require.main === module) {
  (async () => {
    try {
      // Run validation
      const results = await validatePhases();
      
      // Log results to console
      logReport(results);
      
      // Post results to PR if running in GitHub Actions
      if (process.env.GITHUB_ACTIONS === 'true') {
        await postResultsToPR(results);
        
        // Set GitHub Actions output
        core.setOutput('validation_passed', results.isValid);
        
        // Set GitHub Actions step success/failure
        if (!results.isValid) {
          core.setFailed('Three-phase workflow validation failed');
        }
      }
      
      // Exit with appropriate code
      process.exit(results.isValid ? 0 : 1);
    } catch (error) {
      console.error('Error running validation:', error);
      core.setFailed(`Error running validation: ${error.message}`);
      process.exit(1);
    }
  })();
}

module.exports = {
  validatePhases,
  postResultsToPR
};