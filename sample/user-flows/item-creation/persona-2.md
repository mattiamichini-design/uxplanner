---
title: Persona 2
---

# Create an item from a template

A sample flow for the UX Planner demo. The Everyday task journey shows the same steps from the persona's point of view.

```mermaid
flowchart TD
    start["Opens New item"] --> template{"Use a template?"}
    template -- "Yes" --> pick["Picks a saved template"]
    template -- "No" --> fill["Fills in the fields"]
    pick --> review["Reviews the prefilled fields"]
    fill --> save["Saves the item"]
    review --> save
    save --> history["Sees the change in the history"]
```

## Notes

- Templates keep the steps they repeat often.
- Every save is listed in the history.
