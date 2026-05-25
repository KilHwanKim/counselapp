# Using this repo with Cursor

This repository is now configured so Cursor can apply project guidance automatically.

## Applied rules in this repository

1. [`.cursor/rules/project.mdc`](.cursor/rules/project.mdc) contains the core project context.
2. [`.cursor/rules/CURSOR.mdc`](.cursor/rules/CURSOR.mdc) is the Cursor-readable rule that activates this setup.
3. `CURSOR.md` itself is documentation for humans. Cursor does not auto-load `CURSOR.md`, so machine-applied instructions should live in `.mdc` files.

## Notes

- Open this repository in Cursor and the rules under `.cursor/rules/` will be available automatically.
- If you update guidance that should affect agent behavior, update the `.mdc` rule files rather than only editing this document.
- Keep the project facts in `.cursor/rules/project.mdc` aligned with the current app structure and deployment behavior.
