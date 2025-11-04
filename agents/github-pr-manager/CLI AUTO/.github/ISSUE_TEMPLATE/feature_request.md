---
name: "Feature Request"
about: "Suggest an idea or enhancement."
title: "[FEATURE] <describe the feature>"
labels: [enhancement, triage]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## Feature Request
        Please describe the feature or enhancement you would like to see.
  - type: input
    id: summary
    attributes:
      label: "Summary"
      description: "A clear and concise description of the feature."
    validations:
      required: true
  - type: textarea
    id: motivation
    attributes:
      label: "Motivation"
      description: "Why is this feature important? What problem does it solve?"
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: "Proposed Solution"
      description: "Describe your proposed solution or approach."
    validations:
      required: false
  - type: textarea
    id: context
    attributes:
      label: "Context"
      description: "Add any other context, links, or screenshots."
    validations:
      required: false
  - type: checkboxes
    id: agent
    attributes:
      label: "Agent System Context"
      options:
        - label: "Requires agent automation"
        - label: "Manual workflow acceptable"
        - label: "Unclear/Other"
    validations:
      required: false
