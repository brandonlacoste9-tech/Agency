---
name: "Agent Task"
about: "Request a specific task for an agent."
title: "[AGENT TASK] <describe the task>"
labels: [agent, triage]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## Agent Task
        Use this template to request a new or updated agent task.
  - type: input
    id: summary
    attributes:
      label: "Task Summary"
      description: "Briefly describe the agent task."
    validations:
      required: true
  - type: textarea
    id: details
    attributes:
      label: "Task Details"
      description: "Describe the task, requirements, and acceptance criteria."
    validations:
      required: true
  - type: textarea
    id: context
    attributes:
      label: "Context"
      description: "Add any relevant context, links, or dependencies."
    validations:
      required: false
  - type: checkboxes
    id: urgency
    attributes:
      label: "Urgency"
      options:
        - label: "Critical (blocks release)"
        - label: "High"
        - label: "Normal"
        - label: "Low"
    validations:
      required: false
  - type: checkboxes
    id: agent
    attributes:
      label: "Agent System Context"
      options:
        - label: "Requires new agent"
        - label: "Update existing agent"
        - label: "Manual fallback acceptable"
    validations:
      required: false
