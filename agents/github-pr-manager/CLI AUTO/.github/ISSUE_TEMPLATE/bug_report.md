---
name: "Bug Report"
about: "Report a bug to help us improve."
title: "[BUG] <describe the bug>"
labels: [bug, triage]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## Bug Report
        Please fill out the following to help us reproduce and fix the issue.
  - type: input
    id: summary
    attributes:
      label: "Summary"
      description: "A clear and concise description of what the bug is."
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: "Steps to Reproduce"
      description: "List the steps to reproduce the behavior."
      placeholder: "1. Go to ...\n2. Click on ...\n3. See error ..."
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: "Expected Behavior"
      description: "What did you expect to happen?"
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: "Actual Behavior"
      description: "What actually happened?"
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: "Relevant Logs/Output"
      description: "Paste any relevant logs, error messages, or screenshots."
    validations:
      required: false
  - type: input
    id: env
    attributes:
      label: "Environment"
      description: "OS, Node version, deployment method, etc."
    validations:
      required: false
  - type: checkboxes
    id: agent
    attributes:
      label: "Agent System Context"
      options:
        - label: "Affects agent automation"
        - label: "Affects manual workflow"
        - label: "Unclear/Other"
    validations:
      required: false
