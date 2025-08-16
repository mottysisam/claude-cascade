# Claude Cascade - Intelligent Planning Workflows for Claude Code
# One-Click Installation Script for Windows PowerShell
# https://github.com/claudecascade/claude-cascade

param(
    [switch]$Force,
    [switch]$SkipPATH,
    [string]$InstallPath = "$env:USERPROFILE\.claude-cascade"
)

# Script metadata
$SCRIPT_VERSION = "1.0.0"
$CASCADE_VERSION = "1.0.0"
$SCRIPT_NAME = "Claude Cascade Installer"

# Installation paths
$CLAUDE_DIR = "$env:USERPROFILE\.claude"
$CASCADE_DIR = $InstallPath
$HOOKS_DIR = "$CASCADE_DIR\hooks"
$STATE_DIR = "$CASCADE_DIR\state"
$BACKUP_DIR = "$CASCADE_DIR\backup\$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Configuration files
$CLAUDE_SETTINGS = "$CLAUDE_DIR\settings.json"
$CLAUDE_MD = "$CLAUDE_DIR\CLAUDE.md"

# Colors for enhanced output
$Colors = @{
    Red    = [ConsoleColor]::Red
    Green  = [ConsoleColor]::Green
    Yellow = [ConsoleColor]::Yellow
    Blue   = [ConsoleColor]::Blue
    Cyan   = [ConsoleColor]::Cyan
    White  = [ConsoleColor]::White
}

# Logging function
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Level) {
        "INFO"    { Write-Host "[$timestamp] $Message" -ForegroundColor $Colors.Cyan }
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor $Colors.Green }
        "WARN"    { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor $Colors.Yellow }
        "ERROR"   { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor $Colors.Red }
        "STEP"    { Write-Host "[$timestamp] 🔧 $Message" -ForegroundColor $Colors.Blue }
    }
}

# Display banner
function Show-Banner {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Cyan
    Write-Host "║                                                                                ║" -ForegroundColor $Colors.Cyan
    Write-Host "║                      🌊 CLAUDE CASCADE INSTALLER 🌊                        ║" -ForegroundColor $Colors.Cyan
    Write-Host "║                                                                                ║" -ForegroundColor $Colors.Cyan
    Write-Host "║                 Intelligent Planning Workflows for Claude Code                ║" -ForegroundColor $Colors.Cyan
    Write-Host "║                                v$CASCADE_VERSION                                    ║" -ForegroundColor $Colors.Cyan
    Write-Host "║                                                                                ║" -ForegroundColor $Colors.Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Cyan
    Write-Host ""
    Write-Host "This installer will set up Claude Cascade's three-phase planning workflow system." -ForegroundColor $Colors.Blue
    Write-Host ""
}

# Check system requirements
function Test-Requirements {
    Write-Log "STEP" "Checking system requirements..."
    
    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        Write-Log "ERROR" "PowerShell 5.0 or later is required. Current version: $($PSVersionTable.PSVersion)"
        return $false
    }
    
    # Check for Claude Code
    try {
        $claudeVersion = claude --version 2>$null
        if ($claudeVersion) {
            Write-Log "SUCCESS" "Claude Code CLI detected"
        }
    }
    catch {
        Write-Log "WARN" "Claude Code CLI not found in PATH. This installer works best with Claude Code installed."
        Write-Host "   You can install Claude Code from: https://claude.ai/code" -ForegroundColor $Colors.Yellow
    }
    
    # Check for required tools (most are built into PowerShell)
    $tools = @("powershell")
    foreach ($tool in $tools) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            Write-Log "ERROR" "Required tool not found: $tool"
            return $false
        }
    }
    
    Write-Log "SUCCESS" "System requirements satisfied"
    return $true
}

# Backup existing configuration
function Backup-ExistingConfig {
    Write-Log "STEP" "Creating backup of existing configuration..."
    
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    
    # Backup Claude settings if they exist
    if (Test-Path $CLAUDE_SETTINGS) {
        Copy-Item $CLAUDE_SETTINGS "$BACKUP_DIR\settings.json.backup"
        Write-Log "SUCCESS" "Backed up existing Claude settings"
    }
    
    # Backup CLAUDE.md if it exists
    if (Test-Path $CLAUDE_MD) {
        Copy-Item $CLAUDE_MD "$BACKUP_DIR\CLAUDE.md.backup"
        Write-Log "SUCCESS" "Backed up existing CLAUDE.md"
    }
    
    # Backup any existing cascade configuration
    if (Test-Path $CASCADE_DIR) {
        Copy-Item -Recurse $CASCADE_DIR "$BACKUP_DIR\cascade-old\"
        Write-Log "SUCCESS" "Backed up existing Claude Cascade installation"
    }
    
    Write-Log "SUCCESS" "Backup completed: $BACKUP_DIR"
}

# Install core hook scripts
function Install-Hooks {
    Write-Log "STEP" "Installing Claude Cascade hook scripts..."
    
    New-Item -ItemType Directory -Path $HOOKS_DIR -Force | Out-Null
    New-Item -ItemType Directory -Path $STATE_DIR -Force | Out-Null
    
    # Get the directory where this script is located
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $srcHooksDir = Join-Path $scriptDir "..\src\hooks"
    
    # Copy hook scripts (convert to Windows batch/PowerShell wrappers)
    if (Test-Path $srcHooksDir) {
        # Copy the original bash scripts
        Copy-Item "$srcHooksDir\*.sh" $HOOKS_DIR
        
        # Create PowerShell wrapper scripts for Windows
        $hooks = @("plan-monitor", "phase-validator", "plan-tracker")
        foreach ($hook in $hooks) {
            $wrapperContent = @"
#!/usr/bin/env pwsh
# Windows PowerShell wrapper for $hook.sh
# This allows the bash script to run on Windows with Git Bash or WSL

param([Parameter(ValueFromRemainingArguments=`$true)]`$Arguments)

`$bashScript = Join-Path `$PSScriptRoot "$hook.sh"

# Try to run with Git Bash first, then WSL
if (Get-Command "bash.exe" -ErrorAction SilentlyContinue) {
    & bash.exe `$bashScript @Arguments
} elseif (Get-Command "wsl.exe" -ErrorAction SilentlyContinue) {
    & wsl.exe bash `$bashScript @Arguments
} else {
    Write-Error "Git Bash or WSL required to run Claude Cascade hooks on Windows"
    Write-Host "Install Git for Windows: https://git-scm.com/download/win"
    exit 1
}
"@
            Set-Content -Path "$HOOKS_DIR\$hook.ps1" -Value $wrapperContent
        }
        
        Write-Log "SUCCESS" "Installed hook scripts to $HOOKS_DIR"
    }
    else {
        Write-Log "ERROR" "Source hook scripts not found at $srcHooksDir"
        return $false
    }
    
    # Initialize state files
    $activePlans = @{
        active_plans = @()
        last_updated = ""
        cascade_version = $CASCADE_VERSION
    } | ConvertTo-Json -Depth 3
    
    $complianceStats = @{
        total_plans = 0
        complete_workflows = 0
        incomplete_workflows = 0
        compliance_rate = 0.0
        phase_counts = @{
            phase1 = 0
            phase2 = 0
            phase3 = 0
        }
        last_updated = ""
        cascade_version = $CASCADE_VERSION
    } | ConvertTo-Json -Depth 3
    
    Set-Content -Path "$STATE_DIR\active_plans.json" -Value $activePlans
    Set-Content -Path "$STATE_DIR\compliance_stats.json" -Value $complianceStats
    New-Item -ItemType File -Path "$STATE_DIR\plan_history.log" -Force | Out-Null
    New-Item -ItemType File -Path "$STATE_DIR\validation.log" -Force | Out-Null
    
    Write-Log "SUCCESS" "Initialized state management files"
    return $true
}

# Install plan templates
function Install-Templates {
    Write-Log "STEP" "Installing plan templates..."
    
    $templatesDir = "$CASCADE_DIR\templates"
    New-Item -ItemType Directory -Path $templatesDir -Force | Out-Null
    
    # Create Phase 1 template
    $phase1Template = @"
# Pre-Execution Plan: [PLAN_NAME]
**Date:** YYYY-MM-DD HH:MM:SS
**Estimated Duration:** [X hours/days]
**Priority:** [High/Medium/Low]

## Objective
[Clear statement of what needs to be accomplished]

## Detailed Steps
1. [Step 1 with specific actions]
2. [Step 2 with specific actions]
3. [Step 3 with specific actions]
...

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
...

## Resources Required
- [Tools, access, dependencies]

## Risks & Mitigation
- **Risk:** [Description] → **Mitigation:** [Strategy]

## Expected Outcomes
[What should be achieved]

## Files to be Modified/Created
- [List of files that will be changed]

## Commands to Execute
- [List of commands that will be run]

## Verification Tests Planned
- [Tests that will be run in Phase 3 to verify completion]
"@
    
    Set-Content -Path "$templatesDir\phase1-pre-exec.md" -Value $phase1Template
    
    # Create Phase 2 template (abbreviated for space)
    $phase2Template = @"
# Post-Execution Report: [PLAN_NAME]
**Date:** YYYY-MM-DD HH:MM:SS
**Actual Duration:** [X hours/days]
**Status:** [Completed/Partially Completed/Failed]
**Original Plan:** [Reference to Phase 1 file]

## What Was Executed
[Detailed account of actions taken]

## Deviations from Plan
[Any changes made during execution and why]

## Issues Encountered
[Problems faced and how they were resolved]

## Results Achieved
[Actual outcomes vs expected]

## Lessons Learned
[Insights for future planning]
"@
    
    Set-Content -Path "$templatesDir\phase2-post-exec.md" -Value $phase2Template
    
    # Create Phase 3 template (abbreviated for space)
    $phase3Template = @"
# Delta Verification Report: [PLAN_NAME]
**Date:** YYYY-MM-DD HH:MM:SS
**Verification Status:** [Pass/Fail/Partial]
**Original Plan:** [Reference to Phase 1 file]
**Execution Report:** [Reference to Phase 2 file]

## Pre vs Post Comparison
### Planned vs Executed
- ✅ **Completed:** [List items that were fully completed]
- ⚠️ **Partially Done:** [Items with partial completion]
- ❌ **Not Done:** [Items not completed]

## Verification Tests Performed
[Actual verification tests and results]

## Overall Assessment
[Summary of plan execution effectiveness]

## Final Status
- **Plan Execution:** [Successful/Failed/Partial]
- **All Tests Passed:** [Yes/No]
- **Ready for Production:** [Yes/No]
"@
    
    Set-Content -Path "$templatesDir\phase3-verification.md" -Value $phase3Template
    
    Write-Log "SUCCESS" "Installed plan templates"
}

# Configure Claude Code integration
function Configure-ClaudeIntegration {
    Write-Log "STEP" "Configuring Claude Code integration..."
    
    # Ensure Claude directory exists
    New-Item -ItemType Directory -Path $CLAUDE_DIR -Force | Out-Null
    
    # Update settings.json to include hooks
    if (Test-Path $CLAUDE_SETTINGS) {
        Write-Log "INFO" "Updating existing Claude settings.json"
        
        try {
            $settings = Get-Content $CLAUDE_SETTINGS | ConvertFrom-Json
            
            # Initialize hooks if they don't exist
            if (-not $settings.hooks) {
                $settings | Add-Member -Type NoteProperty -Name "hooks" -Value @{}
            }
            
            # Add UserPromptSubmit hook
            if (-not $settings.hooks.UserPromptSubmit) {
                $settings.hooks | Add-Member -Type NoteProperty -Name "UserPromptSubmit" -Value @()
            }
            
            # Add hooks for Claude Cascade (using PowerShell wrappers)
            $userPromptHook = @{
                hooks = @(
                    @{
                        type = "command"
                        command = "powershell.exe -File `"$HOOKS_DIR\plan-monitor.ps1`" prompt-check"
                    }
                )
            }
            
            $settings.hooks.UserPromptSubmit += $userPromptHook
            
            # Convert back to JSON and save
            $settings | ConvertTo-Json -Depth 10 | Set-Content $CLAUDE_SETTINGS
            
            Write-Log "SUCCESS" "Updated Claude settings.json with Cascade hooks"
        }
        catch {
            Write-Log "ERROR" "Failed to update settings.json: $($_.Exception.Message)"
            return $false
        }
    }
    else {
        Write-Log "INFO" "Creating new Claude settings.json"
        
        $newSettings = @{
            permissions = @{
                allow = @(
                    "Bash", "Read", "Edit", "Write", "WebFetch", "Grep", "Glob", "LS",
                    "MultiEdit", "NotebookRead", "NotebookEdit", "TodoRead", "TodoWrite", "WebSearch"
                )
            }
            hooks = @{
                UserPromptSubmit = @(
                    @{
                        hooks = @(
                            @{
                                type = "command"
                                command = "powershell.exe -File `"$HOOKS_DIR\plan-monitor.ps1`" prompt-check"
                            }
                        )
                    }
                )
            }
        }
        
        $newSettings | ConvertTo-Json -Depth 10 | Set-Content $CLAUDE_SETTINGS
        Write-Log "SUCCESS" "Created new Claude settings.json with Cascade hooks"
    }
    
    # Update or create CLAUDE.md
    Write-Log "INFO" "Configuring CLAUDE.md with Cascade workflow"
    
    $planningSection = @"
## Planning - Claude Cascade Integration
- **Phase 1 - Pre-Execution Plans**: When suggesting ANY plan, **ALWAYS** immediately save it to `.claude/plans/1_pre_exec_plans/` with format: ``YYYYMMDD_HHMMSS_DESCRIPTIVE_NAME.md``
- **Phase 2 - Post-Execution Plans**: After plan execution, document what was actually done in `.claude/plans/2_post_exec_plans/` using same naming format with ``_EXECUTED`` suffix
- **Phase 3 - Delta Verification**: Compare pre vs post execution, run verification tests, and document findings in `.claude/plans/3_checked_delta_exec_plans/` with ``_VERIFICATION`` suffix
- **Critical Rule**: NEVER suggest a plan without immediately saving it to phase 1 directory
- **Verification Requirement**: Phase 3 must include actual tests/checks to verify completion, not just documentation review
- **Claude Cascade**: Intelligent planning workflows automatically monitored and guided by hooks
"@
    
    if (Test-Path $CLAUDE_MD) {
        # Update existing CLAUDE.md
        $content = Get-Content $CLAUDE_MD -Raw
        if ($content -match "## Planning") {
            $content = $content -replace "## Planning.*?(?=## |\z)", $planningSection
        }
        else {
            $content = $planningSection + "`n`n" + $content
        }
        Set-Content $CLAUDE_MD -Value $content
        Write-Log "SUCCESS" "Updated existing CLAUDE.md with Cascade workflow"
    }
    else {
        # Create new CLAUDE.md
        $newClaudeMd = @"
# CLAUDE.md – Universal Project AI Agent & Engineering Protocol

This document defines engineering practices, code structure, and Claude Code agent responsibilities for this project.

$planningSection

## Enhanced by Claude Cascade
This project uses Claude Cascade for intelligent planning workflows. For more information:
- Repository: https://github.com/claudecascade/claude-cascade
- Documentation: https://claudecascade.dev
- Templates: $CASCADE_DIR\templates\

"@
        Set-Content $CLAUDE_MD -Value $newClaudeMd
        Write-Log "SUCCESS" "Created new CLAUDE.md with Cascade workflow"
    }
    
    return $true
}

# Create CLI command
function Install-CLI {
    Write-Log "STEP" "Installing 'cascade' CLI command..."
    
    # Create CLI script directory
    $binDir = "$CASCADE_DIR\bin"
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
    
    # Create PowerShell CLI script
    $cliScript = @"
#!/usr/bin/env pwsh
# Claude Cascade CLI Tool for Windows
# https://github.com/claudecascade/claude-cascade

param([Parameter(ValueFromRemainingArguments=`$true)]`$Arguments)

`$HOOKS_DIR = "`$env:USERPROFILE\.claude-cascade\hooks"
`$STATE_DIR = "`$env:USERPROFILE\.claude-cascade\state"

function Show-Help {
    Write-Host @"
Claude Cascade CLI - Intelligent Planning Workflows for Claude Code

USAGE:
    cascade <command> [options]

COMMANDS:
    init                Initialize Cascade in current project
    status              Show current plans and compliance
    list                List active plans with details
    help                Show this help message
    version             Show version information

EXAMPLES:
    cascade status              # Show today's plan status
    cascade list                # List all active plans

For more information: https://github.com/claudecascade/claude-cascade
"@
}

function Show-Version {
    Write-Host "Claude Cascade CLI v1.0.0"
    Write-Host "Intelligent planning workflows for Claude Code"
    Write-Host "https://github.com/claudecascade/claude-cascade"
}

`$command = if (`$Arguments.Count -gt 0) { `$Arguments[0] } else { "help" }

switch (`$command) {
    "init" {
        Write-Host "🌊 Initializing Claude Cascade in current project..."
        New-Item -ItemType Directory -Path ".claude\plans\1_pre_exec_plans" -Force | Out-Null
        New-Item -ItemType Directory -Path ".claude\plans\2_post_exec_plans" -Force | Out-Null
        New-Item -ItemType Directory -Path ".claude\plans\3_checked_delta_exec_plans" -Force | Out-Null
        Write-Host "✅ Directory structure created"
        Write-Host "📋 Templates available in: `$env:USERPROFILE\.claude-cascade\templates\"
    }
    "status" {
        Write-Host "📊 Claude Cascade Status (Windows version)"
        Write-Host "Project: `$(Get-Location)"
        Write-Host "For full functionality, use Claude Code with integrated hooks"
    }
    "list" {
        Write-Host "📋 Active Plans (Windows version)"
        if (Test-Path ".claude\plans\1_pre_exec_plans") {
            `$plans = Get-ChildItem ".claude\plans\1_pre_exec_plans\*.md" -ErrorAction SilentlyContinue
            if (`$plans) {
                Write-Host "Found `$(`$plans.Count) Phase 1 plans:"
                `$plans | ForEach-Object { Write-Host "  - `$(`$_.Name)" }
            } else {
                Write-Host "No plans found in current project"
            }
        } else {
            Write-Host "No .claude/plans directory found. Run 'cascade init' first."
        }
    }
    "help" { Show-Help }
    "version" { Show-Version }
    default {
        Write-Host "Unknown command: `$command"
        Write-Host "Run 'cascade help' for usage information"
        exit 1
    }
}
"@
    
    Set-Content -Path "$binDir\cascade.ps1" -Value $cliScript
    
    # Create batch wrapper for easier execution
    $batchWrapper = @"
@echo off
powershell.exe -ExecutionPolicy Bypass -File "%USERPROFILE%\.claude-cascade\bin\cascade.ps1" %*
"@
    
    Set-Content -Path "$binDir\cascade.bat" -Value $batchWrapper
    
    # Add to PATH if not already there
    if (-not $SkipPATH) {
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$binDir*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$binDir", "User")
            Write-Log "SUCCESS" "Added $binDir to user PATH"
        }
    }
    
    Write-Log "SUCCESS" "Installed 'cascade' CLI command"
    return $true
}

# Verify installation
function Test-Installation {
    Write-Log "STEP" "Verifying installation..."
    
    $verificationErrors = @()
    
    # Check if hook scripts exist
    $hooks = @("plan-monitor.sh", "phase-validator.sh", "plan-tracker.sh")
    foreach ($hook in $hooks) {
        if (-not (Test-Path "$HOOKS_DIR\$hook")) {
            $verificationErrors += "Hook script missing: $hook"
        }
    }
    
    # Check state files
    $stateFiles = @("active_plans.json", "compliance_stats.json")
    foreach ($file in $stateFiles) {
        if (-not (Test-Path "$STATE_DIR\$file")) {
            $verificationErrors += "State file missing: $file"
        }
    }
    
    # Check CLI command
    if (-not (Test-Path "$CASCADE_DIR\bin\cascade.ps1")) {
        $verificationErrors += "CLI command not installed"
    }
    
    if ($verificationErrors.Count -gt 0) {
        Write-Log "ERROR" "Installation verification failed:"
        $verificationErrors | ForEach-Object { Write-Host "   ❌ $_" -ForegroundColor $Colors.Red }
        return $false
    }
    else {
        Write-Log "SUCCESS" "Installation verification passed"
        return $true
    }
}

# Display completion message
function Show-Completion {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Green
    Write-Host "║                                                                                ║" -ForegroundColor $Colors.Green
    Write-Host "║                    🎉 CLAUDE CASCADE INSTALLATION COMPLETE! 🎉                  ║" -ForegroundColor $Colors.Green
    Write-Host "║                                                                                ║" -ForegroundColor $Colors.Green
    Write-Host "╚════════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Green
    Write-Host ""
    
    Write-Host "📋 What was installed:" -ForegroundColor $Colors.Blue
    Write-Host "   • Hook scripts for intelligent planning workflow monitoring"
    Write-Host "   • Plan templates for consistent documentation"
    Write-Host "   • 'cascade' CLI tool for project management"
    Write-Host "   • Integration with Claude Code settings"
    Write-Host ""
    
    Write-Host "🚀 Getting started:" -ForegroundColor $Colors.Blue
    Write-Host "   1. Restart PowerShell or Command Prompt"
    Write-Host "   2. Navigate to a project directory"
    Write-Host "   3. Run: cascade init"
    Write-Host "   4. Start using Claude Code - Cascade will guide your planning!"
    Write-Host ""
    
    Write-Host "💡 Quick commands:" -ForegroundColor $Colors.Blue
    Write-Host "   • cascade status    - Show current plans"
    Write-Host "   • cascade help      - Full command reference"
    Write-Host ""
    
    Write-Host "📚 Learn more:" -ForegroundColor $Colors.Blue
    Write-Host "   • Documentation: https://github.com/claudecascade/claude-cascade" -ForegroundColor $Colors.Cyan
    Write-Host "   • Templates: $CASCADE_DIR\templates\" -ForegroundColor $Colors.Cyan
    Write-Host ""
    
    Write-Host "⚠️  Note: Full hook functionality requires Git Bash or WSL on Windows" -ForegroundColor $Colors.Yellow
    Write-Host "   Install Git for Windows: https://git-scm.com/download/win" -ForegroundColor $Colors.Yellow
    Write-Host ""
    
    Write-Host "Thank you for installing Claude Cascade! 🌊" -ForegroundColor $Colors.Cyan
    Write-Host "Happy planning! 📋✨" -ForegroundColor $Colors.Cyan
    Write-Host ""
}

# Main installation flow
function Main {
    Show-Banner
    
    # Confirmation prompt
    Write-Host "This will install Claude Cascade to $CASCADE_DIR" -ForegroundColor $Colors.Blue
    Write-Host "and integrate with Claude Code settings at $CLAUDE_DIR" -ForegroundColor $Colors.Blue
    Write-Host ""
    
    if (-not $Force) {
        $response = Read-Host "Continue with installation? [Y/n]"
        if ($response -match "^[Nn]$") {
            Write-Host "Installation cancelled."
            exit 0
        }
    }
    
    Write-Host ""
    
    # Installation steps
    if (-not (Test-Requirements)) { exit 1 }
    Backup-ExistingConfig
    if (-not (Install-Hooks)) { exit 1 }
    Install-Templates
    if (-not (Configure-ClaudeIntegration)) { exit 1 }
    if (-not (Install-CLI)) { exit 1 }
    
    # Verification
    if (Test-Installation) {
        Show-Completion
    }
    else {
        Write-Log "ERROR" "Installation completed with errors. Check the output above."
        Write-Host ""
        Write-Host "You can try running the installer again or check:" -ForegroundColor $Colors.Yellow
        Write-Host "   • System requirements" -ForegroundColor $Colors.Yellow
        Write-Host "   • File permissions" -ForegroundColor $Colors.Yellow
        Write-Host "   • Backup files in: $BACKUP_DIR" -ForegroundColor $Colors.Yellow
        exit 1
    }
}

# Run installer
Main