---
description: Automatically check Google Cloud SDK release notes for emulator updates and open an issue if any are found.
on:
  schedule:
    daily
  workflow_dispatch:

engine:
  id: codex
  model: gpt-5.1-codex-mini

permissions:
  contents: read
  issues: read

tools:
  bash:
    - "curl -s *"
    - "grep -i *"
  github:
    toolsets: [issues]
    mode: remote

network:
  allowed:
    - groups.google.com
    - r.jina.ai

safe-outputs:
  create-issue:
  noop:

---
# Check Google Cloud SDK Emulator Updates

You are an AI agent that checks the Google Cloud SDK announcements group for any new emulator updates.

## Your Task

1. Use your bash tool to run `curl -sL "https://r.jina.ai/https://groups.google.com/g/google-cloud-sdk-announce"` to fetch the group's contents as markdown.
2. Extract the URL for the latest announcement that looks like `https://groups.google.com/g/google-cloud-sdk-announce/c/[ID]`.
3. Prepend `https://r.jina.ai/` to that URL (e.g., `https://r.jina.ai/https://groups.google.com/g/google-cloud-sdk-announce/c/[ID]`) and `curl -sL` it to fetch the actual announcement text.
4. Check the loaded text specifically for any mentions of "emulator" (e.g., Pub/Sub emulator, Datastore emulator, Spanner emulator, Storage emulator, Bigtable emulator, Firestore emulator).
5. If you find an update, use the `github` tool to query the repository's issues and check if an issue about this specific announcement already exists (e.g. check for the announcement URL or title).
6. ONLY if an issue doesn't already exist, create a new issue for the update using `create-issue`. Otherwise, call `noop`.

## Safe Outputs

When you successfully complete your work:
- If you find any updates related to emulators since the last check, use the `create-issue` safe output.
  - The issue should include the version numbers of the SDK and the specific emulators updated.
  - A summary of the changes, bug fixes, or new features for the emulators.
  - A link to the original announcement.
  - Title the issue: "[emulator status] Google Cloud SDK Emulator Updates".
- **If there was nothing to be done** (no emulator updates found): Call the `noop` safe output with a clear message explaining that you completed the analysis but no action was necessary. This is important for transparency—it signals that you worked successfully AND consciously determined no output was needed.
