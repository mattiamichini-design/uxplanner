---
title: Persona 1
---

# Create an item step by step

A sample flow for the UX Planner demo. The Everyday task journey shows the same steps from the persona's point of view.

```mermaid
flowchart TD
    start["Opens New item"] --> fill["Fills in the required fields"]
    fill --> check{"All required fields filled?"}
    check -- "No" --> hint["Sees which fields are missing"]
    hint --> fill
    check -- "Yes" --> save["Saves the item"]
    save --> done["Sees a confirmation and the saved item"]
```

## Notes

- Each step has a short hint.
- Saving always ends with a confirmation.
