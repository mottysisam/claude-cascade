/**
 * Format-Report.js - Generates formatted PR comments for Claude Cascade validation
 * 
 * This utility formats validation results into structured Markdown for GitHub PR comments,
 * clearly showing the status of each phase and any issues that need to be addressed.
 */

const chalk = require('chalk');

/**
 * Generate a formatted validation report for PR comments
 * 
 * @param {Object} validationResults - Results of the validation
 * @param {boolean} validationResults.isValid - Overall pass/fail status
 * @param {Object} validationResults.phases - Status of each phase
 * @param {Object} validationResults.phases.phase1 - Phase 1 validation details
 * @param {Object} validationResults.phases.phase2 - Phase 2 validation details
 * @param {Object} validationResults.phases.phase3 - Phase 3 validation details
 * @returns {string} Formatted Markdown report
 */
function formatReport(validationResults) {
  const { isValid, phases } = validationResults;
  
  let report = `## 🌊 Claude Cascade Validation Report\n\n`;
  
  // Overall status
  const overallStatus = isValid 
    ? `### Overall Status: ✅ READY TO MERGE`
    : `### Overall Status: ❌ NOT READY`;
  
  report += `${overallStatus}\n\n`;
  
  // Add completion percentage
  const completedPhases = Object.values(phases).filter(p => p.isValid).length;
  const totalPhases = Object.keys(phases).length;
  const completionPercentage = Math.round((completedPhases / totalPhases) * 100);
  
  report += `**Completion**: ${completionPercentage}% (${completedPhases}/${totalPhases} phases)\n\n`;
  
  // Format each phase
  report += formatPhase('Phase 1: Pre-Execution Plan', phases.phase1);
  report += formatPhase('Phase 2: Post-Execution Record', phases.phase2);
  report += formatPhase('Phase 3: Delta Verification', phases.phase3);
  
  // Add required actions section if there are issues
  if (!isValid) {
    report += `### Required Actions\n\n`;
    
    Object.entries(phases).forEach(([phaseName, phase]) => {
      if (!phase.isValid) {
        const phaseNumber = phaseName.replace('phase', '');
        report += formatRequiredActions(phaseNumber, phase);
      }
    });
  } else {
    report += `### 🎉 Congratulations!\n\nAll phases are complete and validated. This PR is ready to be merged.\n\n`;
  }
  
  return report;
}

/**
 * Format a single phase's validation results
 * 
 * @param {string} title - Phase title
 * @param {Object} phase - Phase validation details
 * @returns {string} Formatted phase section
 */
function formatPhase(title, phase) {
  if (!phase) {
    return `#### ${title}\n- Status: ⚠️ Not Checked\n\n`;
  }
  
  let status;
  if (phase.exists === false) {
    status = '❌ Missing';
  } else if (phase.isValid) {
    status = '✅ Complete';
  } else {
    status = '⚠️ Issues Found';
  }
  
  let phaseReport = `#### ${title}\n- Status: ${status}\n`;
  
  if (phase.filePath) {
    phaseReport += `- File: \`${phase.filePath}\`\n`;
  }
  
  if (phase.issues && phase.issues.length > 0) {
    phaseReport += `- Issues:\n`;
    phase.issues.forEach(issue => {
      phaseReport += `  - ${issue}\n`;
    });
  }
  
  return phaseReport + '\n';
}

/**
 * Format required actions based on phase issues
 * 
 * @param {string} phaseNumber - Phase number (1, 2, or 3)
 * @param {Object} phase - Phase validation details
 * @returns {string} Formatted actions
 */
function formatRequiredActions(phaseNumber, phase) {
  if (!phase || phase.isValid) {
    return '';
  }
  
  let actions = '';
  const dirMap = {
    '1': '1_pre_exec_plans',
    '2': '2_post_exec_plans',
    '3': '3_checked_delta_exec_plans'
  };
  
  const suffixMap = {
    '1': '',
    '2': '_EXECUTED',
    '3': '_VERIFICATION'
  };
  
  if (phase.exists === false) {
    actions += `- **Create Phase ${phaseNumber} file** in \`.claude/plans/${dirMap[phaseNumber]}/\` directory\n`;
    actions += `  - Use filename format: \`YYYYMMDD_HHMMSS_PLAN_NAME${suffixMap[phaseNumber]}.md\`\n`;
  }
  
  if (phase.issues && phase.issues.length > 0) {
    actions += `- **Fix issues in Phase ${phaseNumber}**:\n`;
    phase.issues.forEach(issue => {
      actions += `  - ${issue}\n`;
    });
  }
  
  return actions;
}

/**
 * Log a validation report to console with colors
 * 
 * @param {Object} validationResults - Results of the validation
 */
function logReport(validationResults) {
  const { isValid, phases } = validationResults;
  
  console.log(chalk.bold.blue('\n🌊 Claude Cascade Validation Report'));
  console.log('----------------------------------------');
  
  // Overall status
  const overallStatus = isValid 
    ? chalk.bold.green('✅ READY TO MERGE')
    : chalk.bold.red('❌ NOT READY');
  
  console.log(`Overall Status: ${overallStatus}`);
  
  // Completion percentage
  const completedPhases = Object.values(phases).filter(p => p.isValid).length;
  const totalPhases = Object.keys(phases).length;
  const completionPercentage = Math.round((completedPhases / totalPhases) * 100);
  
  console.log(`Completion: ${completionPercentage}% (${completedPhases}/${totalPhases} phases)\n`);
  
  // Log each phase
  logPhase('Phase 1: Pre-Execution Plan', phases.phase1);
  logPhase('Phase 2: Post-Execution Record', phases.phase2);
  logPhase('Phase 3: Delta Verification', phases.phase3);
}

/**
 * Log a single phase's validation results to console with colors
 * 
 * @param {string} title - Phase title
 * @param {Object} phase - Phase validation details
 */
function logPhase(title, phase) {
  if (!phase) {
    console.log(`${chalk.bold(title)}: ${chalk.yellow('⚠️ Not Checked')}\n`);
    return;
  }
  
  let status;
  if (phase.exists === false) {
    status = chalk.red('❌ Missing');
  } else if (phase.isValid) {
    status = chalk.green('✅ Complete');
  } else {
    status = chalk.yellow('⚠️ Issues Found');
  }
  
  console.log(`${chalk.bold(title)}: ${status}`);
  
  if (phase.filePath) {
    console.log(`File: ${chalk.blue(phase.filePath)}`);
  }
  
  if (phase.issues && phase.issues.length > 0) {
    console.log('Issues:');
    phase.issues.forEach(issue => {
      console.log(`  - ${chalk.yellow(issue)}`);
    });
  }
  
  console.log('');
}

module.exports = {
  formatReport,
  logReport
};