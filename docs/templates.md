# 📋 Template Guide for Claude Cascade

*Master the art of consistent, effective planning documentation*

## 🎯 Template Philosophy

Templates in Claude Cascade aren't rigid forms—they're **thinking frameworks** that guide you toward complete, actionable plans while maintaining consistency across your team.

## 📚 Built-in Template Overview

Claude Cascade includes three core templates, each optimized for its specific phase:

### Phase 1: Pre-Execution Planning Template
**Purpose**: Structure your thinking before implementation
**Location**: `~/.claude-cascade/templates/phase1-pre-exec.md`

### Phase 2: Post-Execution Reporting Template  
**Purpose**: Capture what actually happened during implementation
**Location**: `~/.claude-cascade/templates/phase2-post-exec.md`

### Phase 3: Delta Verification Template
**Purpose**: Systematically verify completion and quality
**Location**: `~/.claude-cascade/templates/phase3-verification.md`

## 🛠️ Using Templates Effectively

### Quick Template Usage

```bash
# Copy template to your project
cp ~/.claude-cascade/templates/phase1-pre-exec.md .claude/plans/1_pre_exec_plans/20250816_143000_MY_FEATURE.md

# Edit with your favorite editor
vim .claude/plans/1_pre_exec_plans/20250816_143000_MY_FEATURE.md
```

### Template Variables

All templates include placeholders you should replace:

- `[PLAN_NAME]` → Your descriptive plan name
- `YYYY-MM-DD HH:MM:SS` → Current timestamp
- `[X hours/days]` → Your time estimate
- `[High/Medium/Low]` → Priority level
- `[Description]` → Your specific content

### Template Completion Checklist

Before moving to the next phase, ensure:

**Phase 1 (Pre-Execution)**:
- [ ] Clear, measurable objective stated
- [ ] Steps are specific and actionable
- [ ] Success criteria are verifiable
- [ ] Risks and dependencies identified
- [ ] Time estimate provided

**Phase 2 (Post-Execution)**:
- [ ] Actual work performed documented
- [ ] Deviations from plan explained
- [ ] Issues encountered and resolved
- [ ] Time actual vs estimated
- [ ] Next steps clearly identified

**Phase 3 (Verification)**:
- [ ] Specific tests performed
- [ ] Results documented with evidence
- [ ] Pass/fail status clear
- [ ] Overall assessment provided
- [ ] Production readiness confirmed

## 🎨 Customizing Templates

### Project-Specific Templates

Create templates tailored to your project type:

```bash
# Create project template directory
mkdir .claude/templates

# Copy base templates
cp ~/.claude-cascade/templates/* .claude/templates/

# Customize for your needs
vim .claude/templates/phase1-pre-exec.md
```

### Domain-Specific Examples

#### Frontend Feature Template

```markdown
# Pre-Execution Plan: [FEATURE_NAME]
**Date:** YYYY-MM-DD HH:MM:SS
**Component Area:** [Components/Pages/Hooks/Utils]
**Priority:** [High/Medium/Low]
**Estimated Duration:** [X hours]

## Objective
[Clear description of the UI/UX goal]

## User Stories
- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]

## Design Requirements
- [ ] Responsive design for mobile/tablet/desktop
- [ ] Accessibility (WCAG 2.1 AA compliance)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance budget: [loading time/bundle size]

## Technical Implementation
1. [Component architecture decisions]
2. [State management approach]
3. [API integration points]
4. [Testing strategy]

## Acceptance Criteria
- [ ] Visual design matches mockups
- [ ] All user interactions work smoothly
- [ ] Performance metrics meet targets
- [ ] Accessibility tests pass
- [ ] Cross-browser testing complete

## Verification Tests Planned
- Visual regression testing
- User acceptance testing
- Performance benchmarking
- Accessibility audit
```

#### Backend API Template

```markdown
# Pre-Execution Plan: [API_ENDPOINT_NAME]
**Date:** YYYY-MM-DD HH:MM:SS
**Service:** [Service/Module name]
**Priority:** [High/Medium/Low]
**Estimated Duration:** [X hours]

## Objective
[Clear description of the API functionality]

## API Specification
**Endpoint**: [HTTP_METHOD] /api/v1/[resource]
**Authentication**: [Bearer token/API key/None]
**Rate Limiting**: [requests per minute/hour]

### Request Format
```json
{
  "field1": "string",
  "field2": "number"
}
```

### Response Format
```json
{
  "success": true,
  "data": {...},
  "metadata": {...}
}
```

## Database Changes
- [ ] New tables: [list]
- [ ] Schema modifications: [list]
- [ ] Indexes needed: [list]
- [ ] Migration strategy: [approach]

## Security Considerations
- [ ] Input validation rules
- [ ] Authorization checks
- [ ] Rate limiting implementation
- [ ] Audit logging requirements

## Integration Points
- [ ] External services: [list]
- [ ] Internal services: [list]
- [ ] Third-party APIs: [list]

## Verification Tests Planned
- Unit tests for business logic
- Integration tests for database
- API contract testing
- Security penetration testing
- Performance/load testing
```

#### DevOps/Infrastructure Template

```markdown
# Pre-Execution Plan: [INFRASTRUCTURE_CHANGE]
**Date:** YYYY-MM-DD HH:MM:SS
**Environment:** [Development/Staging/Production]
**Priority:** [High/Medium/Low]
**Estimated Duration:** [X hours]
**Maintenance Window**: [Required/Not Required]

## Objective
[Clear description of infrastructure goal]

## Infrastructure Changes
### New Resources
- [ ] Servers/Instances: [specifications]
- [ ] Databases: [type, size, configuration]
- [ ] Load balancers: [configuration]
- [ ] Storage: [type, capacity]

### Configuration Changes
- [ ] Network settings: [details]
- [ ] Security groups: [rules]
- [ ] Environment variables: [changes]
- [ ] SSL certificates: [updates]

## Deployment Strategy
1. [Step-by-step deployment process]
2. [Rollback procedure if needed]
3. [Validation checkpoints]
4. [Communication plan]

## Risk Assessment
- **High Risk**: [risks that could cause outages]
- **Medium Risk**: [risks that could cause degradation]
- **Mitigation**: [specific mitigation strategies]

## Success Criteria
- [ ] All services healthy after deployment
- [ ] Performance metrics within acceptable range
- [ ] No data loss or corruption
- [ ] Rollback tested and verified
- [ ] Monitoring and alerting functional

## Verification Tests Planned
- Health check validation
- Performance baseline comparison
- Disaster recovery testing
- Security vulnerability scan
- Compliance verification
```

### Team-Specific Customizations

#### Adding Team Conventions

```markdown
## Team Review Requirements
- [ ] Code review by [specific team member roles]
- [ ] Security review by [security team]
- [ ] UX review by [design team]
- [ ] Performance review by [performance team]

## Communication Plan
- [ ] Slack notification in #[channel]
- [ ] Email update to [stakeholders]
- [ ] Documentation updated in [location]
- [ ] Demo scheduled for [audience]
```

#### Including Compliance Requirements

```markdown
## Compliance Checklist
- [ ] GDPR privacy impact assessed
- [ ] SOC 2 controls validated
- [ ] Data retention policy followed
- [ ] Audit trail requirements met
- [ ] Change management process followed
```

## 🔧 Advanced Template Features

### Dynamic Template Selection

Create a template chooser script:

```bash
#!/bin/bash
# cascade-template-chooser.sh

echo "Select template type:"
echo "1) Frontend Feature"
echo "2) Backend API"
echo "3) DevOps/Infrastructure"
echo "4) Bug Fix"
echo "5) Refactoring"

read -p "Enter choice (1-5): " choice

case $choice in
    1) template="frontend-feature.md" ;;
    2) template="backend-api.md" ;;
    3) template="devops-infra.md" ;;
    4) template="bug-fix.md" ;;
    5) template="refactoring.md" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

cp ~/.claude-cascade/templates/$template .claude/plans/1_pre_exec_plans/$(date +%Y%m%d_%H%M%S)_${1:-NEW_PLAN}.md
echo "Template created: .claude/plans/1_pre_exec_plans/$(date +%Y%m%d_%H%M%S)_${1:-NEW_PLAN}.md"
```

### Template Validation

Add validation scripts to ensure template completeness:

```bash
#!/bin/bash
# validate-phase1-plan.sh

plan_file="$1"

if [ ! -f "$plan_file" ]; then
    echo "❌ Plan file not found: $plan_file"
    exit 1
fi

# Check required sections
required_sections=("## Objective" "## Detailed Steps" "## Success Criteria" "## Verification Tests Planned")
missing_sections=()

for section in "${required_sections[@]}"; do
    if ! grep -q "$section" "$plan_file"; then
        missing_sections+=("$section")
    fi
done

if [ ${#missing_sections[@]} -eq 0 ]; then
    echo "✅ Phase 1 plan validation passed"
    exit 0
else
    echo "❌ Phase 1 plan validation failed. Missing sections:"
    printf '%s\n' "${missing_sections[@]}"
    exit 1
fi
```

### Template Metrics

Track template usage and effectiveness:

```bash
# Add to your templates
## Template Metrics (Auto-populated)
**Template Version:** v2.1
**Completion Time:** [Auto-calculated by hooks]
**Success Rate:** [Based on verification results]
**Team Adoption:** [Usage statistics]
```

## 📊 Template Analytics

### Measuring Template Effectiveness

Track these metrics to improve your templates:

1. **Completion Rate**: What percentage of plans complete all three phases?
2. **Quality Score**: How well do plans meet their success criteria?
3. **Time Accuracy**: How close are estimates to actual time?
4. **Issue Prevention**: How many bugs are caught in verification?

### Template Evolution

Continuously improve templates based on:

```bash
# Generate template usage report
cascade analytics --template-usage

# Example output:
# Template Usage Report
# =====================
# frontend-feature.md: 23 uses, 87% completion rate
# backend-api.md: 18 uses, 92% completion rate
# devops-infra.md: 12 uses, 67% completion rate
# 
# Recommendations:
# - devops-infra.md has low completion rate, consider simplifying
# - backend-api.md is most successful, use as model for others
```

## 🏆 Template Best Practices

### Do's

✅ **Keep templates focused**: Each template should serve one specific purpose
✅ **Use clear language**: Avoid jargon and ambiguous terms
✅ **Include examples**: Show what good completion looks like
✅ **Make sections optional**: Mark nice-to-have vs. required sections
✅ **Version your templates**: Track changes and improvements over time

### Don'ts

❌ **Don't over-engineer**: Simple templates are more likely to be used
❌ **Don't make them too long**: Long templates discourage completion
❌ **Don't include everything**: Focus on what's essential for this phase
❌ **Don't forget maintenance**: Update templates based on team feedback
❌ **Don't ignore adoption**: If templates aren't used, they need improvement

### Template Adoption Strategy

1. **Start Simple**: Begin with basic templates, add complexity gradually
2. **Lead by Example**: Use templates consistently yourself
3. **Gather Feedback**: Regularly ask team for template improvement suggestions
4. **Measure Success**: Track completion rates and quality improvements
5. **Iterate Quickly**: Make small, frequent improvements rather than major overhauls

## 🔄 Template Maintenance

### Regular Review Schedule

**Monthly**: Review template usage statistics
**Quarterly**: Gather team feedback on template effectiveness
**Bi-annually**: Major template updates based on learned best practices

### Template Version Control

Keep templates in version control:

```bash
# Create templates repository
git init ~/.claude-cascade/templates
cd ~/.claude-cascade/templates
git add .
git commit -m "Initial template set v1.0"

# Tag versions
git tag v1.0

# Track changes
git log --oneline
```

### Sharing Templates

Share successful templates with the community:

```bash
# Export your templates for sharing
cascade templates export --format zip

# Import templates from others
cascade templates import team-templates.zip
```

## 🌟 Community Templates

### Contributing Templates

1. **Test thoroughly**: Use template for at least 5 real projects
2. **Document usage**: Include when and how to use the template
3. **Provide examples**: Show completed templates in action
4. **Follow conventions**: Use standard naming and structure

### Template Repository

The Claude Cascade community maintains templates for:

- **Industry-specific**: FinTech, HealthTech, Gaming, etc.
- **Technology-specific**: React, Node.js, Python, Go, etc.
- **Process-specific**: Bug fixes, security updates, migrations, etc.
- **Scale-specific**: Solo developer, small team, enterprise, etc.

## 🎯 Conclusion

Effective templates are the foundation of successful Claude Cascade adoption. They:

- **Reduce cognitive load** by providing structure
- **Ensure consistency** across team members
- **Capture institutional knowledge** in reusable form
- **Improve over time** through measurement and iteration

Remember: The best template is the one your team actually uses. Start simple, measure effectiveness, and evolve based on real usage patterns.

---

*Ready to create templates that transform your team's planning? Start with one template, use it consistently, and build from there.*