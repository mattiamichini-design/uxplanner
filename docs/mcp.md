# MCP server

UX Planner ships a stdio MCP server that any MCP client can launch. It gives an agent tools to read your planning documents and make small, validated changes, and in clients that support MCP Apps it also shows the UX Planner interface. It talks to a runner you started with the CLI and uses that runner's validated writes.

## How it fits together

- **Runner:** the UX Planner app on localhost, started with `ux-planner start`. It is the only process that writes to a project.
- **MCP server:** `mcp/server.bundle.mjs`, built by `npm run build`. The client launches it over stdio. It reads the runner's port and private token from `.ux-planner/runner.lock` in the project and sends every request to that runner.
- **MCP App:** the `ui://ux-planner/workspace-v2` resource bundles the product's React pages, components, CSS and fonts. It loads data through the MCP tools, so the panel needs no browser connection to localhost. Clients without MCP Apps support still get the tools.
- **Host features:** the server also declares sidebar and thread entry points and composer document mentions for hosts that support them. **Attach** and **Send** appear only when the host advertises those capabilities.

The server runs on your computer and reaches only `127.0.0.1`. Web clients that connect to MCP servers over public HTTPS cannot reach it.

## Set up

Build the app, initialize the project and start a runner on it (Node 22.15 or newer):

```sh
npm ci
npm run build
node bin/ux-planner.mjs init --root /absolute/path/to/project
node bin/ux-planner.mjs start --root /absolute/path/to/project --port 4311
```

For experiments, run `node bin/ux-planner.mjs demo --port 4311` and use the temporary path it prints as the project.

Then add the server to your MCP client. Most clients accept this configuration:

```json
{
  "mcpServers": {
    "ux-planner": {
      "command": "node",
      "args": ["/absolute/path/to/uxplanner/mcp/server.bundle.mjs"],
      "env": { "UX_PLANNER_CLI": "/absolute/path/to/uxplanner/bin/ux-planner.mjs" }
    }
  }
}
```

`UX_PLANNER_CLI` is optional. With it, the start commands that the server suggests use the full path to the CLI.

Clients with a command line can add the same server directly:

```sh
claude mcp add ux-planner -- node /absolute/path/to/uxplanner/mcp/server.bundle.mjs
codex mcp add ux-planner -- node /absolute/path/to/uxplanner/mcp/server.bundle.mjs
```

In OpenCode, add a local server to the `mcp` section of `opencode.json` with `"command": ["node", "/absolute/path/to/uxplanner/mcp/server.bundle.mjs"]`.

Start a new agent session in the project folder so the tools load. After changing only server or MCP App code, run `npm run build:mcp`. After UI or route changes, run `npm run build`.

## Projects and routing

`ux-planner init`, `start` and `demo` register a project. Each record lives in `${XDG_DATA_HOME:-~/.local/share}/ux-planner/workspaces/<sha256(root)>.json` and holds `{version:1,root}`. The server only reads and writes registered projects that have a `docs/ux` folder. Set `UX_PLANNER_REGISTRY_DIR` to keep the records somewhere else.

- **In a project:** when the client starts the server in a project folder, the server uses that folder and nothing else. If the client reports MCP roots that disagree with that folder, the server stops with a message.
- **Global:** when the client starts the server from `/`, `open_workspace` lists every registered project, including projects whose runner is stopped, with the command to start them on port 4311. Every data tool then needs an explicit `workspace:<root-id>`. If that port is busy, change `--port` and refresh.

Each runner answers only with its own root, and its token works only on that runner.

## Context and changes

1. In the MCP App, open **Context** and select journeys, personas, flows or stories (up to 12 documents, 300 KB in total). **Select current page** picks the page you are on.
2. **Attach to conversation** adds the selection to the model context. **Send to AI** sends your prompt with the selected documents. The server re-reads each document before sending it.
3. Where the host supports mentions, search for a document from the composer.
4. Ask the agent to add or edit a journey item. It reads the document first and uses its revision, row, column and index; a write against an outdated revision is rejected.
5. A localhost page that is open on the same journey refreshes when the revision changes. If you are editing a form there, a notice asks you to save first.

Tools: `open_workspace`, `list_documents`, `read_documents`, `add_journey_item`, `update_journey_item`, `create_story`, `search_mentions`, and the app-only `workspace_context` and `workspace_snapshot`. Through MCP you can add and edit journey notes and create stories. Persona editing, journey structure and CSV import run in the localhost app. Flows and existing stories are read-only through MCP.

## Verify

```sh
npm run test:mcp
npm run test:routing
node mcp/check-runtime.mjs
```

`test:mcp` starts the production runtime on a temporary copy of the sample workspace and drives the bundled server with the official MCP SDK client. It covers tools, resources, entry-point and mention metadata, the four document types, journey and story writes, stale and concurrent write rejection, path, origin and token guards, and revision updates and page rendering after writes. It uses port 4331; set `UX_MCP_TEST_PORT` to change it.

`test:routing` runs two runners and MCP clients with project, global, missing and conflicting roots, and checks project selection, isolation and token rejection. It uses ports 4355 and 4356; set `UX_ROUTING_TEST_PORT` to change them.

`check-runtime.mjs` checks the MCP App's bridge to the host with synthetic data.

## Remove

Stop the runner with Ctrl+C and remove `ux-planner` from your client's MCP configuration. Planning files stay in their projects. To unlist a project, delete its record in `${XDG_DATA_HOME:-~/.local/share}/ux-planner/workspaces/`.
