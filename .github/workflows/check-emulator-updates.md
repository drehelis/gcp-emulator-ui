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
    - "gh issue list *"
    - "gh issue view *"
  github:

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
5. Before creating an issue, you MUST check if it already exists. Use your bash tool to run: `gh issue list --search "[emulator status] in:title" --state all --repo ${{ github.repository }} -L 20`
6. Review the resulting list of issues. If ANY of those issues are for this specific announcement (read the issue bodies if necessary by using `gh issue view <number> --repo ${{ github.repository }}`), DO NOT create a new issue.
7. ONLY if you are absolutely certain no issue exists for this announcement, create a new issue for the update using the `create-issue` tool.
   Use EXACTLY the following format for the issue title (replace X.Y.Z and YYYY-MM-DD accordingly):
   `Google Cloud CLI X.Y.Z (released YYYY-MM-DD) includes emulator release notes.`
   Use EXACTLY the following format for the issue body:
   ```markdown
   Latest Google Cloud CLI announcement includes emulator changes.

   SDK version:

   * X.Y.Z (YYYY-MM-DD)

   Emulator updates:

   * [Extracted emulator bullet point 1]
   * [Extracted emulator bullet point 2]

   Source announcement:

   * [The Jina URL you extracted, e.g., https://r.jina.ai/https://groups.google.com/g/google-cloud-sdk-announce/c/DrV-9LmYLQE]
   ```
8. Exit completely by reporting success with `noop`.

## Safe Outputs

When you successfully complete your work:
- If you find any updates related to emulators since the last check, use the `create-issue` safe output.
  - The issue should include the version numbers of the SDK and the specific emulators updated.
  - A summary of the changes, bug fixes, or new features for the emulators.
  - A link to the original announcement.
  - Title the issue: "[emulator status] Google Cloud SDK Emulator Updates".
- **If there was nothing to be done** (no emulator updates found): Call the `noop` safe output with a clear message explaining that you completed the analysis but no action was necessary. This is important for transparency—it signals that you worked successfully AND consciously determined no output was needed.
