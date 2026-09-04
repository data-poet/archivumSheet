# Comments

Code should be self-explanatory through clear naming and structure. Comments are the exception, not the default.

- Default to no comments.
- Only add a comment when the WHY is non-obvious: a hidden constraint, a workaround for a specific bug, a subtle invariant, or behavior that would surprise a reader.
- Never explain WHAT the code does — good names already do that.
- Never reference the current task, ticket, or fix ("added for X", "fixes #123") — that belongs in the commit message, not the code.
- Keep comments as short as possible — one line, not a paragraph.
- No commented-out code, no restating the function/variable name in prose.

# Commits

- Never add a `Co-Authored-By` trailer or any other AI-attribution line — commits are authored by the user alone.
- Commit messages are one-liners, no body and always not signed.
