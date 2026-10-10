---
title: Persona 1
---

# Fix a problem with the help pages

A sample flow for the UX Planner demo. The Getting help journey shows the same steps from the persona's point of view.

```mermaid
flowchart TD
    error["Sees an error message"] --> link["Opens the suggested article"]
    link --> solved{"Problem solved?"}
    solved -- "Yes" --> resume["Returns to the saved work"]
    solved -- "No" --> contact["Writes to support"]
    contact --> reply["Receives an answer"]
    reply --> resume
```

## Notes

- The error links to the most relevant article.
- Work is saved before leaving the page.
