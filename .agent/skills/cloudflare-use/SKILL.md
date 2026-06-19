---
name: cloudflare-use
description: Use this skill to safely and correctly interact with (read/write) the project's Cloudflare D1 database and R2 storage bucket across different computers. Trigger this whenever the user asks to check the database, query D1, upload/read images from R2, or verify Cloudflare contents.
---

# Cloudflare Use (D1 & R2)

This skill provides standard operating procedures for executing commands against the Cloudflare D1 database and R2 storage bucket within this project, ensuring it works across any computer or operating system.

## Context
- **Project Structure**: This skill operates within the current workspace directory (where `wrangler.toml` and `.env` are located). Do NOT hardcode drive letters (like `D:\`).
- **Database (D1)**: `core-pulse-blog`
- **Storage (R2)**: `core-pulse-assets`
- **Authentication**: Requires `CLOUDFLARE_API_TOKEN` which is stored in the project's `.env` file.

## Execution Workflow

When the user asks you to interact with D1 or R2, you MUST follow these exact steps:

1. **Locate the Project Root**: 
   - Identify the current project root by locating the `.env` or `wrangler.toml` file in the current workspace.

2. **Pre-flight Check (.env & Token)**: 
   - Check the `.env` file in the project root using the `view_file` tool.
   - Verify that `CLOUDFLARE_API_TOKEN` is present and not empty.
   - **IF THE TOKEN IS MISSING**: DO NOT attempt to run any commands. Instead, assist the user in obtaining one:
     - Tell the user: "Your `.env` file is missing the `CLOUDFLARE_API_TOKEN`. To use this project on this computer, you need to set it up."
     - Instruct them to go to the Cloudflare Dashboard -> My Profile -> API Tokens.
     - Tell them to create a Custom Token with the following permissions:
       - Account -> D1 -> Edit
       - Account -> Worker R2 Storage -> Edit
       - Zone -> Workers Routes -> Edit (if needed for deployment)
     - Ask them to provide the token so you can add it to their `.env` file.
     - WAIT for their response before proceeding.

3. **Format the Command**: 
   - Once the token is confirmed, inject it via environment variables and run the `wrangler` command.
   - Ensure you are executing the command from the project root directory.
   - Example for PowerShell: `$env:CLOUDFLARE_API_TOKEN="<YOUR_TOKEN>"; npx wrangler d1 execute core-pulse-blog --command="<YOUR_SQL_QUERY>" --remote`
   - Example for Bash/Linux/macOS: `CLOUDFLARE_API_TOKEN="<YOUR_TOKEN>" npx wrangler d1 execute core-pulse-blog --command="<YOUR_SQL_QUERY>" --remote`
   - For R2 operations, use: `npx wrangler r2 object put/get core-pulse-assets/...` with the token injected.

## Important Rules
- ALWAYS use `--remote` for D1 queries unless the user explicitly asks for the local development database.
- ALWAYS use dynamic paths (like relative paths or the current workspace root) instead of hardcoding absolute paths like `D:\CORE-PULSE`.
- DO NOT log or output the API token directly in your text responses to the user.
- If an authentication error occurs, double-check that the token was properly injected into the terminal session.
