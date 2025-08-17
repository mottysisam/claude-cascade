import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PhaseTreeDataProvider } from '../providers/treeDataProvider';

export async function verify(rootPath: string, treeDataProvider: PhaseTreeDataProvider) {
    try {
        // Find Phase 2 execution reports without corresponding Phase 3 verifications
        const phase2Dir = path.join(rootPath, '.claude', 'plans', '2_post_exec_plans');
        const phase3Dir = path.join(rootPath, '.claude', 'plans', '3_checked_delta_exec_plans');

        if (!fs.existsSync(phase2Dir)) {
            vscode.window.showWarningMessage('No Phase 2 execution reports found. Complete execution first.');
            return;
        }

        // Get all Phase 2 execution reports
        const phase2Files = fs.readdirSync(phase2Dir)
            .filter(file => file.endsWith('.md') && file.includes('EXECUTED') && !file.startsWith('TEMPLATE'))
            .sort()
            .reverse(); // Most recent first

        if (phase2Files.length === 0) {
            vscode.window.showWarningMessage('No Phase 2 execution reports found. Complete execution first.');
            return;
        }

        // Find unverified executions (Phase 2 without Phase 3)
        const unverifiedExecutions = phase2Files.filter(file => {
            const planId = file.substring(0, 15); // Extract timestamp
            const verificationFile = fs.existsSync(phase3Dir) ? 
                fs.readdirSync(phase3Dir).find(f => f.includes(planId) && f.includes('VERIFICATION')) : 
                null;
            return !verificationFile;
        });

        if (unverifiedExecutions.length === 0) {
            vscode.window.showInformationMessage('All Phase 2 executions already have verifications! 🎉');
            return;
        }

        // Let user select which execution to verify
        const executionOptions = unverifiedExecutions.map(file => {
            const planMatch = file.match(/^\d{8}_\d{6}_(.+)_EXECUTED\.md$/);
            const displayName = planMatch ? 
                planMatch[1].split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                ).join(' ') : 
                file.replace('_EXECUTED.md', '');
            
            return {
                label: displayName,
                description: file.substring(0, 15), // Show timestamp
                detail: `Phase 2 execution ready for verification`,
                file: file
            };
        });

        const selectedExecution = await vscode.window.showQuickPick(executionOptions, {
            placeHolder: 'Select which execution to verify...'
        });

        if (!selectedExecution) {
            return; // User cancelled
        }

        // Read the Phase 2 execution report
        const phase2Path = path.join(phase2Dir, selectedExecution.file);
        const phase2Content = fs.readFileSync(phase2Path, 'utf8');
        
        // Extract plan information
        const planIdMatch = selectedExecution.file.match(/^(\d{8}_\d{6})/);
        const planId = planIdMatch ? planIdMatch[1] : '';
        const planNameMatch = selectedExecution.file.match(/^\d{8}_\d{6}_(.+)_EXECUTED\.md$/);
        const planName = planNameMatch ? 
            planNameMatch[1].split('_').map(word => 
                word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' ') : 
            'Unknown Plan';

        // Create Phase 3 filename
        const phase3FileName = selectedExecution.file.replace('_EXECUTED.md', '_VERIFICATION.md');
        
        // Ensure Phase 3 directory exists
        if (!fs.existsSync(phase3Dir)) {
            fs.mkdirSync(phase3Dir, { recursive: true });
        }

        const phase3Path = path.join(phase3Dir, phase3FileName);

        // Create Phase 3 verification template
        const verificationTemplate = `# Phase 3: Delta Verification - ${planName}

**Verified:** ${new Date().toLocaleString()}  
**Original Plan ID:** ${planId}  
**Phase 2 Report:** [${selectedExecution.file}](../2_post_exec_plans/${selectedExecution.file})

## Verification Summary
<!-- High-level assessment of plan vs execution vs results -->

**Overall Status:** [ ] ✅ Success | [ ] ⚠️ Partial | [ ] ❌ Issues

## Plan vs Execution Analysis
<!-- Compare what was planned vs what was actually done -->

### ✅ Objectives Met
- 
- 
- 

### ⚠️ Deviations from Plan
- 
- 
- 

### ❌ Objectives Not Met
- 
- 
- 

## Quality Verification
<!-- Verify the quality of the implementation -->

### Code Quality
- [ ] Code follows project standards
- [ ] Proper error handling implemented
- [ ] Security considerations addressed
- [ ] Performance requirements met

### Testing Verification
- [ ] All planned tests executed
- [ ] Test coverage adequate
- [ ] Edge cases handled
- [ ] Integration points verified

### Documentation Verification
- [ ] Code properly documented
- [ ] README updated if needed
- [ ] API documentation current
- [ ] User guides updated

## Quantitative Metrics
<!-- Measurable outcomes where applicable -->

| Metric | Planned | Actual | Status |
|--------|---------|--------|--------|
| Files Modified | - | - | - |
| Lines of Code | - | - | - |
| Test Coverage | - | - | - |
| Performance Impact | - | - | - |

## Issues Discovered & Resolutions
<!-- Problems found during verification and how they were addressed -->


## Lessons Learned
<!-- Key takeaways for future planning -->

### What Worked Well
- 
- 

### What Could Be Improved
- 
- 

### Process Improvements for Next Time
- 
- 

## Final Validation
<!-- Final checks and sign-off -->

### Technical Validation
- [ ] All acceptance criteria met
- [ ] No breaking changes introduced
- [ ] Performance within acceptable limits
- [ ] Security review passed

### Business Validation  
- [ ] Feature works as intended
- [ ] User experience is acceptable
- [ ] Stakeholder requirements satisfied
- [ ] No negative side effects

## Compliance Status
<!-- Three-phase methodology compliance -->

- [x] **Phase 1 Complete:** Original plan created and reviewed
- [x] **Phase 2 Complete:** Execution documented and results captured
- [x] **Phase 3 Complete:** Verification performed and delta analyzed

## Recommendations
<!-- Suggestions for follow-up work or improvements -->


---
*Generated by Claude Cascade VS Code Extension*

## Original Phase 2 Execution Summary
\`\`\`markdown
${phase2Content.split('\n').slice(0, 25).join('\n')}
...
\`\`\`

---
**🎉 Three-Phase Planning Workflow Complete! 🎉**
`;

        // Write the verification report
        fs.writeFileSync(phase3Path, verificationTemplate, 'utf8');

        // Open the new verification report
        const document = await vscode.workspace.openTextDocument(phase3Path);
        await vscode.window.showTextDocument(document);

        // Refresh the tree view
        treeDataProvider.refresh();

        // Show celebration message
        vscode.window.showInformationMessage(
            `🎉 Phase 3 verification created for: ${planName}. Three-phase workflow complete!`,
            'Show Dashboard',
            'Show Plans'
        ).then(selection => {
            if (selection === 'Show Dashboard') {
                vscode.commands.executeCommand('claudeCascade.showDashboard');
            } else if (selection === 'Show Plans') {
                vscode.commands.executeCommand('claudeCascadePlans.focus');
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create verification report: ${error}`);
    }
}