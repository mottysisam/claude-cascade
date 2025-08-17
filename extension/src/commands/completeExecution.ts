import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PhaseTreeDataProvider } from '../providers/treeDataProvider';

export async function completeExecution(rootPath: string, treeDataProvider: PhaseTreeDataProvider) {
    try {
        // Find Phase 1 plans without corresponding Phase 2 execution reports
        const phase1Dir = path.join(rootPath, '.claude', 'plans', '1_pre_exec_plans');
        const phase2Dir = path.join(rootPath, '.claude', 'plans', '2_post_exec_plans');

        if (!fs.existsSync(phase1Dir)) {
            vscode.window.showWarningMessage('No Phase 1 plans found. Create a plan first.');
            return;
        }

        // Get all Phase 1 plans
        const phase1Files = fs.readdirSync(phase1Dir)
            .filter(file => file.endsWith('.md') && !file.startsWith('TEMPLATE'))
            .sort()
            .reverse(); // Most recent first

        if (phase1Files.length === 0) {
            vscode.window.showWarningMessage('No Phase 1 plans found. Create a plan first.');
            return;
        }

        // Find incomplete plans (Phase 1 without Phase 2)
        const incompletePlans = phase1Files.filter(file => {
            const planId = file.replace('.md', '').substring(0, 15); // Extract timestamp
            const executedFile = fs.existsSync(phase2Dir) ? 
                fs.readdirSync(phase2Dir).find(f => f.includes(planId) && f.includes('EXECUTED')) : 
                null;
            return !executedFile;
        });

        if (incompletePlans.length === 0) {
            vscode.window.showInformationMessage('All Phase 1 plans already have execution reports!');
            return;
        }

        // Let user select which plan to mark as executed
        const planOptions = incompletePlans.map(file => {
            const planName = file.match(/^\d{8}_\d{6}_(.+)\.md$/);
            const displayName = planName ? 
                planName[1].split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                ).join(' ') : 
                file.replace('.md', '');
            
            return {
                label: displayName,
                description: file.substring(0, 15), // Show timestamp
                detail: `Phase 1 plan ready for execution report`,
                file: file
            };
        });

        const selectedPlan = await vscode.window.showQuickPick(planOptions, {
            placeHolder: 'Select which plan you have completed executing...'
        });

        if (!selectedPlan) {
            return; // User cancelled
        }

        // Read the original Phase 1 plan
        const phase1Path = path.join(phase1Dir, selectedPlan.file);
        const phase1Content = fs.readFileSync(phase1Path, 'utf8');
        
        // Extract plan information
        const planIdMatch = selectedPlan.file.match(/^(\d{8}_\d{6})/);
        const planId = planIdMatch ? planIdMatch[1] : '';
        const planNameMatch = selectedPlan.file.match(/^\d{8}_\d{6}_(.+)\.md$/);
        const planName = planNameMatch ? 
            planNameMatch[1].split('_').map(word => 
                word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' ') : 
            'Unknown Plan';

        // Create Phase 2 filename
        const phase2FileName = `${planId}_${selectedPlan.file.replace('.md', '')}_EXECUTED.md`;
        
        // Ensure Phase 2 directory exists
        if (!fs.existsSync(phase2Dir)) {
            fs.mkdirSync(phase2Dir, { recursive: true });
        }

        const phase2Path = path.join(phase2Dir, phase2FileName);

        // Create Phase 2 execution report template
        const executionTemplate = `# Phase 2: Post-Execution Report - ${planName}

**Executed:** ${new Date().toLocaleString()}  
**Original Plan ID:** ${planId}  
**Phase 1 Plan:** [${selectedPlan.file}](../1_pre_exec_plans/${selectedPlan.file})

## What Was Executed
<!-- Detailed description of what was actually implemented -->


## Results Achieved
<!-- Concrete outcomes and deliverables -->

### Files Created/Modified
- 
- 
- 

### Features Implemented
- 
- 
- 

## Deviations from Original Plan
<!-- Any changes made during implementation -->


## Technical Decisions Made
<!-- Key technical choices and their rationale -->


## Issues Encountered & Resolutions
<!-- Problems that came up and how they were solved -->


## Testing Performed
<!-- What testing was done to validate the implementation -->

- [ ] Unit tests
- [ ] Integration tests  
- [ ] Manual testing
- [ ] Performance testing

## Code Quality Checks
<!-- Quality assurance performed -->

- [ ] Code review
- [ ] Linting/formatting
- [ ] Security review
- [ ] Documentation updated

## Next Steps & Follow-up Required
<!-- What needs to happen next -->


## Success Criteria Review
<!-- Check against original Phase 1 success criteria -->

From original plan:
<!-- Copy success criteria from Phase 1 and mark completion status -->


---
*Generated by Claude Cascade VS Code Extension*

## Original Phase 1 Plan Reference
\`\`\`markdown
${phase1Content.split('\n').slice(0, 20).join('\n')}
...
\`\`\`
`;

        // Write the execution report
        fs.writeFileSync(phase2Path, executionTemplate, 'utf8');

        // Open the new execution report
        const document = await vscode.workspace.openTextDocument(phase2Path);
        await vscode.window.showTextDocument(document);

        // Refresh the tree view
        treeDataProvider.refresh();

        // Show success message and remind about Phase 3
        vscode.window.showInformationMessage(
            `✅ Phase 2 execution report created for: ${planName}. Don't forget Phase 3 verification!`,
            'Create Phase 3',
            'Show Plans'
        ).then(selection => {
            if (selection === 'Create Phase 3') {
                vscode.commands.executeCommand('claudeCascade.verify');
            } else if (selection === 'Show Plans') {
                vscode.commands.executeCommand('claudeCascadePlans.focus');
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create execution report: ${error}`);
    }
}