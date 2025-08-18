/**
 * Check-Plan-Content.js - Validates content quality of Claude Cascade phase documents
 * 
 * This utility checks if plans have the required sections and valid content structure.
 */

const fs = require('fs');
const path = require('path');

/**
 * Check if a Phase 1 plan has all required sections and valid content
 * 
 * @param {string} filePath - Path to the Phase 1 plan file
 * @returns {Object} Validation results with issues array
 */
function validatePhase1Plan(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for required sections
    const requiredSections = ['Objective', 'Detailed Steps', 'Success Criteria'];
    const missingSections = findMissingSections(content, requiredSections);
    
    if (missingSections.length > 0) {
      issues.push(`Missing required sections: ${missingSections.join(', ')}`);
    }
    
    // Check content quality
    if (content.length < 500) {
      issues.push('Plan content is too brief. Add more detail to meet quality standards.');
    }
    
    // Check for implementation steps
    if (!hasNumberedSteps(content)) {
      issues.push('No numbered implementation steps found. Add step-by-step instructions.');
    }
    
    // Check for success criteria with measurable metrics
    const successCriteriaSection = extractSection(content, 'Success Criteria');
    if (successCriteriaSection) {
      if (!hasMeasurableMetrics(successCriteriaSection)) {
        issues.push('No measurable metrics found in Success Criteria. Add quantifiable targets.');
      }
      
      if (!hasListItems(successCriteriaSection)) {
        issues.push('Success Criteria should be formatted as a list with bullet points.');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Error reading or parsing file: ${error.message}`]
    };
  }
}

/**
 * Check if a Phase 2 execution record has all required sections and valid content
 * 
 * @param {string} filePath - Path to the Phase 2 execution record file
 * @returns {Object} Validation results with issues array
 */
function validatePhase2Record(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for required sections
    const requiredSections = ['What Was Executed', 'Results Achieved', 'Deviations from Plan'];
    const missingSections = findMissingSections(content, requiredSections);
    
    if (missingSections.length > 0) {
      issues.push(`Missing required sections: ${missingSections.join(', ')}`);
    }
    
    // Check content quality
    if (content.length < 300) {
      issues.push('Execution record is too brief. Add more detail about what was implemented.');
    }
    
    // Check for specific execution details
    const executedSection = extractSection(content, 'What Was Executed');
    if (executedSection && !hasNumberedSteps(executedSection) && !hasListItems(executedSection)) {
      issues.push('What Was Executed section should contain numbered steps or bullet points.');
    }
    
    // Check for results details
    const resultsSection = extractSection(content, 'Results Achieved');
    if (resultsSection && !hasListItems(resultsSection) && !hasNumberedSteps(resultsSection)) {
      issues.push('Results Achieved section should detail outcomes as a list.');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Error reading or parsing file: ${error.message}`]
    };
  }
}

/**
 * Check if a Phase 3 verification has all required sections and valid content
 * 
 * @param {string} filePath - Path to the Phase 3 verification file
 * @returns {Object} Validation results with issues array
 */
function validatePhase3Verification(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for required sections
    const requiredSections = ['Verification Tests Performed', 'Success Criteria Assessment', 'Final Status'];
    const missingSections = findMissingSections(content, requiredSections);
    
    if (missingSections.length > 0) {
      issues.push(`Missing required sections: ${missingSections.join(', ')}`);
    }
    
    // Check for verification tests
    const testsSection = extractSection(content, 'Verification Tests Performed');
    if (testsSection) {
      if (!testsSection.includes('Command/Action:') && !testsSection.includes('Test:')) {
        issues.push('No specific verification tests documented. Add actual test commands or procedures.');
      }
      
      if (!testsSection.includes('Expected Result:') && !testsSection.includes('Actual Result:')) {
        issues.push('Verification tests should include expected and actual results.');
      }
    }
    
    // Check for success criteria assessment
    const assessmentSection = extractSection(content, 'Success Criteria Assessment');
    if (assessmentSection && !hasMeasurableMetrics(assessmentSection)) {
      issues.push('Success Criteria Assessment should include quantitative results.');
    }
    
    // Check final status
    const finalStatus = extractSection(content, 'Final Status');
    if (finalStatus) {
      if (!finalStatus.includes('PASS') && !finalStatus.includes('FAIL') && 
          !finalStatus.includes('COMPLETE') && !finalStatus.includes('INCOMPLETE')) {
        issues.push('Final Status should clearly indicate PASS/FAIL or COMPLETE/INCOMPLETE status.');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Error reading or parsing file: ${error.message}`]
    };
  }
}

/**
 * Check for cross-phase consistency between all three phases
 * 
 * @param {string} phase1Path - Path to Phase 1 plan
 * @param {string} phase2Path - Path to Phase 2 execution record
 * @param {string} phase3Path - Path to Phase 3 verification
 * @returns {Object} Validation results with issues array
 */
function validateCrossPhaseConsistency(phase1Path, phase2Path, phase3Path) {
  const issues = [];
  
  try {
    if (!fs.existsSync(phase1Path) || !fs.existsSync(phase2Path) || !fs.existsSync(phase3Path)) {
      return {
        isValid: false,
        issues: ['Cannot validate cross-phase consistency: One or more phase files are missing.']
      };
    }
    
    // Extract plan name from filenames to check consistency
    const phase1Name = extractPlanNameFromPath(phase1Path);
    const phase2Name = extractPlanNameFromPath(phase2Path, '_EXECUTED');
    const phase3Name = extractPlanNameFromPath(phase3Path, '_VERIFICATION');
    
    if (phase1Name !== phase2Name) {
      issues.push(`Phase 2 execution record (${phase2Name}) does not match Phase 1 plan name (${phase1Name}).`);
    }
    
    if (phase1Name !== phase3Name) {
      issues.push(`Phase 3 verification (${phase3Name}) does not match Phase 1 plan name (${phase1Name}).`);
    }
    
    // Check for success criteria consistency
    const phase1Content = fs.readFileSync(phase1Path, 'utf8');
    const phase3Content = fs.readFileSync(phase3Path, 'utf8');
    
    const phase1Criteria = extractSection(phase1Content, 'Success Criteria');
    const phase3Assessment = extractSection(phase3Content, 'Success Criteria Assessment');
    
    if (phase1Criteria && phase3Assessment) {
      const phase1Points = countListItems(phase1Criteria);
      const phase3Points = countListItems(phase3Assessment);
      
      if (phase3Points < phase1Points) {
        issues.push(`Not all success criteria from Phase 1 (${phase1Points} points) are assessed in Phase 3 (${phase3Points} points).`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  } catch (error) {
    return {
      isValid: false,
      issues: [`Error validating cross-phase consistency: ${error.message}`]
    };
  }
}

// Helper functions

/**
 * Extract a specific section from markdown content
 * 
 * @param {string} content - Markdown content
 * @param {string} sectionName - Name of the section to extract
 * @returns {string|null} Section content or null if not found
 */
function extractSection(content, sectionName) {
  const regex = new RegExp(`## ${sectionName}\\s+([\\s\\S]*?)(?=\\s*##\\s+|\\s*$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Find which required sections are missing from a document
 * 
 * @param {string} content - Document content
 * @param {string[]} requiredSections - Array of required section names
 * @returns {string[]} Array of missing section names
 */
function findMissingSections(content, requiredSections) {
  return requiredSections.filter(section => !content.includes(`## ${section}`));
}

/**
 * Check if content has numbered steps
 * 
 * @param {string} content - Content to check
 * @returns {boolean} True if numbered steps are found
 */
function hasNumberedSteps(content) {
  return /^\d+\.\s+.+/m.test(content);
}

/**
 * Check if content has list items
 * 
 * @param {string} content - Content to check
 * @returns {boolean} True if list items are found
 */
function hasListItems(content) {
  return /^[-*]\s+.+/m.test(content);
}

/**
 * Check if content has measurable metrics (percentages, numbers, etc.)
 * 
 * @param {string} content - Content to check
 * @returns {boolean} True if measurable metrics are found
 */
function hasMeasurableMetrics(content) {
  return /\d+%|\d+\s*(seconds|minutes|hours|ms|tests|users)|\b\d+\/\d+\b/.test(content);
}

/**
 * Count the number of list items in a section
 * 
 * @param {string} content - Section content
 * @returns {number} Number of list items
 */
function countListItems(content) {
  const listItemMatches = content.match(/^[-*]\s+.+/gm);
  return listItemMatches ? listItemMatches.length : 0;
}

/**
 * Extract plan name from a file path
 * 
 * @param {string} filePath - Path to a phase file
 * @param {string} suffix - Optional suffix to remove (e.g., '_EXECUTED')
 * @returns {string} Plan name
 */
function extractPlanNameFromPath(filePath, suffix = '') {
  const fileName = path.basename(filePath, '.md');
  
  // Extract plan name (after YYYYMMDD_HHMMSS_)
  const matches = fileName.match(/^\d{8}_\d{6}_(.+?)$/);
  
  if (matches && matches[1]) {
    let planName = matches[1];
    if (suffix && planName.endsWith(suffix)) {
      planName = planName.substring(0, planName.length - suffix.length);
    }
    return planName;
  }
  
  return fileName; // Fallback to the whole filename
}

module.exports = {
  validatePhase1Plan,
  validatePhase2Record,
  validatePhase3Verification,
  validateCrossPhaseConsistency,
  extractPlanNameFromPath
};