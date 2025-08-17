/**
 * todo-enforcer.js - Enhances TodoWrite tool with phase compliance enforcement
 * 
 * This script wraps the existing TodoWrite tool to enforce three-phase planning
 * methodology by:
 * 
 * 1. Validating phase prefixes in todo items
 * 2. Preventing phase 2 from starting without completed phase 1
 * 3. Preventing tasks from being marked complete without proper documentation
 * 4. Blocking new tasks if existing plans have incomplete phases
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Configuration
const CONFIG = {
  enforcePhasePrefix: true,        // Require phase prefix on todos
  blockIncompletePhases: true,     // Block operations when phases incomplete
  preventPhaseSkipping: true,      // Prevent starting Phase 2 before Phase 1 complete
  validatePhaseCompletion: true,   // Validate file existence before marking complete
  logToFile: true,                 // Log operations to file
};

// Constants
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PLANS_DIR = path.join(PROJECT_DIR, '.claude', 'plans');
const PHASE1_DIR = path.join(PLANS_DIR, '1_pre_exec_plans');
const PHASE2_DIR = path.join(PLANS_DIR, '2_post_exec_plans');
const PHASE3_DIR = path.join(PLANS_DIR, '3_checked_delta_exec_plans');
const LOGS_DIR = path.join(PROJECT_DIR, '.claude', 'logs');
const TODO_LOG = path.join(LOGS_DIR, 'todo_enforcer.log');

// Ensure directories exist
try {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
} catch (err) {
  console.error(`Error creating logs directory: ${err.message}`);
}

/**
 * Log a message to console and optionally to file
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Message to log
 */
function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Console output with colors
  const colors = {
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',  // Reset
  };
  
  console[level === 'error' ? 'error' : 'log'](`${colors[level] || ''}[${level.toUpperCase()}]${colors.reset} ${message}`);
  
  // Log to file if enabled
  if (CONFIG.logToFile) {
    try {
      fs.appendFileSync(TODO_LOG, logMessage + '\n');
    } catch (err) {
      console.error(`Error writing to log file: ${err.message}`);
    }
  }
}

/**
 * Check if a Phase 1 plan exists for a given todo item
 * @param {Object} todo - Todo item to check
 * @returns {boolean} - True if a matching plan exists
 */
function hasPhase1Plan(todo) {
  try {
    if (!fs.existsSync(PHASE1_DIR)) {
      return false;
    }
    
    // Extract keywords from todo content
    const keywords = todo.content
      .toUpperCase()
      .replace(/PHASE [123]:/i, '')
      .trim()
      .replace(/\s+/g, '_');
    
    // Look for matching plan files
    const files = fs.readdirSync(PHASE1_DIR);
    return files.some(file => {
      if (file.startsWith('TEMPLATE') || !file.endsWith('.md')) {
        return false;
      }
      
      // Check if keywords are in the filename
      return keywords.split('_').every(keyword => 
        file.includes(keyword) || file.includes(keyword.substring(0, 5))
      );
    });
  } catch (err) {
    log('error', `Error checking for Phase 1 plan: ${err.message}`);
    return false;
  }
}

/**
 * Check if there are any incomplete phases in the project
 * @returns {Promise<boolean>} - True if all phases are complete
 */
async function checkIncompletePhases() {
  try {
    // Use the pre-action-validator to check phases
    const validatorScript = path.join(path.dirname(__dirname), 'hooks', 'pre-action-validator.sh');
    
    if (!fs.existsSync(validatorScript)) {
      log('warn', `Validator script not found: ${validatorScript}`);
      return true;
    }
    
    const { stdout, stderr } = await exec(`${validatorScript} validate_phases`);
    
    // If the output contains any incomplete phase indicators
    if (stdout.includes('Missing Phase') || stdout.includes('❌')) {
      log('warn', 'Found incomplete phases in the project');
      return false;
    }
    
    return true;
  } catch (err) {
    log('error', `Error checking incomplete phases: ${err.message}`);
    return false;
  }
}

/**
 * Validate a todo item based on three-phase planning rules
 * @param {Object} todo - Todo item to validate
 * @param {string} operation - Operation being performed (add, update, delete)
 * @returns {Object} - Validation result with isValid and message
 */
async function validateTodo(todo, operation) {
  // Skip validation for completed tasks (except when marking complete)
  if (todo.status === 'completed' && operation !== 'update') {
    return { isValid: true };
  }
  
  // Check for phase prefix if enabled
  if (CONFIG.enforcePhasePrefix) {
    const hasPhasePrefix = /^Phase [123]:/i.test(todo.content);
    if (!hasPhasePrefix) {
      return { 
        isValid: false, 
        message: 'Todo must start with "Phase 1:", "Phase 2:", or "Phase 3:"'
      };
    }
  }
  
  // Extract phase number
  const phaseMatch = todo.content.match(/^Phase ([123]):/i);
  const phase = phaseMatch ? parseInt(phaseMatch[1]) : 0;
  
  // Phase-specific validations
  if (phase === 1) {
    // For Phase 1, check if marking complete but no plan file exists
    if (CONFIG.validatePhaseCompletion && 
        todo.status === 'completed' && 
        operation === 'update') {
      
      if (!hasPhase1Plan(todo)) {
        return {
          isValid: false,
          message: 'Cannot mark Phase 1 complete without a plan document. Create a Phase 1 plan first.'
        };
      }
    }
  } else if (phase === 2) {
    // For Phase 2, prevent starting if Phase 1 is not complete
    if (CONFIG.preventPhaseSkipping && 
        todo.status === 'in_progress' && 
        operation === 'update') {
      
      // Check if any Phase 1 todos are incomplete
      const phasesComplete = await checkIncompletePhases();
      if (!phasesComplete) {
        return {
          isValid: false,
          message: 'Cannot start Phase 2 until all Phase 1 plans are complete'
        };
      }
    }
  }
  
  // Block operations if there are incomplete phases
  if (CONFIG.blockIncompletePhases && operation === 'add') {
    const phasesComplete = await checkIncompletePhases();
    if (!phasesComplete) {
      return {
        isValid: false,
        message: 'Cannot add new todos while there are incomplete phases. Complete all phases first.'
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Process an array of todos and enforce phase compliance
 * @param {Array} todos - Array of todo items
 * @param {string} operation - Operation being performed
 * @returns {Promise<Object>} - Processing result
 */
async function processTodos(todos, operation) {
  const validations = await Promise.all(
    todos.map(todo => validateTodo(todo, operation))
  );
  
  // Check if any todos failed validation
  const invalidTodo = validations.findIndex(v => !v.isValid);
  if (invalidTodo >= 0) {
    return {
      success: false,
      message: validations[invalidTodo].message,
      todo: todos[invalidTodo]
    };
  }
  
  return { success: true, todos };
}

/**
 * Main function to process TodoWrite tool input
 * @param {Object} input - TodoWrite input
 * @returns {Promise<Object>} - Processing result
 */
async function main(input) {
  try {
    const { todos } = input;
    
    // Determine operation based on differences with existing todos
    // (This would need integration with the actual TodoWrite tool)
    const operation = 'update'; // Default assumption
    
    const result = await processTodos(todos, operation);
    if (!result.success) {
      log('error', result.message);
      return {
        error: result.message,
        todo: result.todo
      };
    }
    
    log('info', `Processed ${todos.length} todos successfully`);
    return { todos: result.todos };
  } catch (err) {
    log('error', `Error processing todos: ${err.message}`);
    return { error: err.message };
  }
}

// Export for use as a module
module.exports = {
  processTodos,
  validateTodo,
  hasPhase1Plan,
  checkIncompletePhases,
};

// Command line interface
if (require.main === module) {
  // Read from stdin
  let input = '';
  process.stdin.on('data', chunk => {
    input += chunk;
  });
  
  process.stdin.on('end', async () => {
    try {
      const data = JSON.parse(input);
      const result = await main(data);
      console.log(JSON.stringify(result));
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
}