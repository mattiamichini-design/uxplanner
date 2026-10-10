---
title: Persona 2
---

# Send a detailed request

A sample flow for the UX Planner demo. The Getting help journey shows the same steps from the persona's point of view.

```mermaid
flowchart TD
    notice["Notices a wrong result"] --> search["Searches the help pages"]
    search --> found{"Found the exact case?"}
    found -- "Yes" --> fix["Applies the fix"]
    found -- "No" --> request["Opens a request and attaches details"]
    request --> updates["Receives updates until it is closed"]
    updates --> fix
```

## Notes

- Details are attached automatically when possible.
- Open requests show their current status.
