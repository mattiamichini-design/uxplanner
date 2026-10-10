# Security policy

UX Planner is a single-user tool that runs on your computer. The runner listens on 127.0.0.1 only, accepts writes only from the pages it serves, and the MCP server reaches a runner only with the token in that project's lock file. Reports about anything that breaks these boundaries are especially useful: access from another origin or host, reads or writes outside a project's `docs/ux/`, or a way around revision checks.

## Supported versions

Security fixes go into the latest commit on `main`. Pull and rebuild to get them.

## Report a vulnerability

Please do not open a public issue. Report it privately through GitHub instead: open the repository's **Security** tab and choose **Report a vulnerability**. Include the steps to reproduce, the commit you tested and what an attacker could do.

The maintainer replies in the private advisory. Once a fix is on `main`, the advisory is published with credit to you, unless you ask to stay anonymous.
