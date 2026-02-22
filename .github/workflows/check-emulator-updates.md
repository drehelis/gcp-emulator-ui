---
description: Automatically check Google Cloud SDK release notes for emulator updates
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
  pull-requests: read

tools:
  bash:
    - "curl -s *"
    - "grep -i *"
  github:
    toolsets: [issues, repos]

network:
  allowed:
    - r.jina.ai

safe-outputs:
  create-issue:
    labels: [report, agentic-workflows]
  noop:

---
# Check Google Cloud SDK Emulator Updates

You are an AI agent that checks the Google Cloud SDK announcements group for any new emulator updates.

## Your Task

1. Use your bash tool to run `curl -sL "https://r.jina.ai/https://groups.google.com/g/google-cloud-sdk-announce" | grep -E "Google Cloud CLI [0-9.]+ is now available for download" | head -1` to fetch the group's contents as markdown.
2. Extract the URL for the latest announcement that looks like `https://groups.google.com/g/google-cloud-sdk-announce/c/[ID]`.
3. Prepend `https://r.jina.ai/` to that URL (e.g., `https://r.jina.ai/https://groups.google.com/g/google-cloud-sdk-announce/c/[ID]`) and `curl -sL` it to fetch the actual announcement text.
4. Check the loaded text specifically for any mentions of "emulator" (e.g., Pub/Sub emulator, Datastore emulator, Spanner emulator, Storage emulator, Bigtable emulator, Firestore emulator).
5. Before creating an issue, you MUST check if it already exists. Use your github tool to search for issues with: `includes "emulator release notes" "[X.Y.Z]" in:title is:issue repo:${{ github.repository }}`, , replacing `[X.Y.Z]` with the SDK version you found.
6. Review the results. If ANY existing issue (open or closed) is for this specific SDK version, DO NOT create a new issue.
7. ONLY if you are absolutely certain no issue exists for this announcement, create a new issue for the update using the `create-issue` tool.
   Use EXACTLY the following format for the issue title (replace X.Y.Z and YYYY-MM-DD accordingly):
   `Google Cloud CLI X.Y.Z (released YYYY-MM-DD) includes emulator release notes`
   Use EXACTLY the following format for the issue body:
   ```markdown
   Latest Google Cloud CLI announcement includes emulator changes.

   SDK version:

   * X.Y.Z (YYYY-MM-DD)

   Emulator updates:

   * [Extracted emulator bullet point 1]
   * [Extracted emulator bullet point 2]

   Source announcement:

   * [The Jina URL you extracted, e.g., https://groups.google.com/g/google-cloud-sdk-announce/c/[ID]]
   ```
8. Exit completely by reporting success with `noop`.

## Safe Outputs

When you successfully complete your work:
- If you find any updates related to emulators since the last check, use the `create-issue` safe output.
  - The issue should include the version numbers of the SDK and the specific emulators updated.
  - A summary of the changes, bug fixes, or new features for the emulators.
  - A link to the original announcement.
- **If there was nothing to be done** (no emulator updates found): Call the `noop` safe output with a clear message explaining that you completed the analysis but no action was necessary. This is important for transparency—it signals that you worked successfully AND consciously determined no output was needed.
