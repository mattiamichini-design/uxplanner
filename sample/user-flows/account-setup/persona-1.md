---
title: Persona 1
---

# Sign up with email

A sample flow for the UX Planner demo. The Getting started journey shows the same steps from the persona's point of view.

```mermaid
flowchart TD
    start["Opens the sign-up page"] --> email["Enters email and password"]
    email --> valid{"Details valid?"}
    valid -- "No" --> fix["Sees what to correct"]
    fix --> email
    valid -- "Yes" --> confirm["Confirms the email address"]
    confirm --> example["Chooses an example to start from"]
    example --> home["Arrives on the home page"]
```

## Notes

- Only the fields needed now are required.
- Errors appear next to the field they refer to.
- Starting from an example is optional.
