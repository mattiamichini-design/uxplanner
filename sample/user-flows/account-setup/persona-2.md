---
title: Persona 2
---

# Sign up with an existing account

A sample flow for the UX Planner demo. The Getting started journey shows the same steps from the persona's point of view.

```mermaid
flowchart TD
    start["Opens the sign-up page"] --> sso["Continues with an existing account"]
    sso --> allowed{"Access granted?"}
    allowed -- "No" --> back["Returns to the sign-up page with a message"]
    allowed -- "Yes" --> import{"Import data now?"}
    import -- "Yes" --> upload["Uploads a file and reviews the preview"]
    import -- "Later" --> home["Arrives on the home page"]
    upload --> home
```

## Notes

- No password to create.
- Import can be done later from settings.
- The preview shows problems before anything is saved.
