---
description: Automatically check Google Cloud SDK release notes for emulator updates and open an issue if any are found.
on:
  schedule:
    daily
  workflow_dispatch:

engine: codex

permissions:
  contents: read
  issues: read

tools:
  web-fetch:

network:
  allowed:
    - groups.google.com

safe-outputs:
  create-issue:
  noop:

---
# Check Google Cloud SDK Emulator Updates

You are an AI agent that checks the Google Cloud SDK announcements group for any new emulator updates.

## Your Task

1. Navigate to https://groups.google.com/g/google-cloud-sdk-announce
2. Look for recent announcements regarding updates to the Google Cloud SDK.
3. Check the release notes or announcement text specifically for any mentions of "emulator" (e.g., Pub/Sub emulator, Datastore emulator, Spanner emulator, Storage emulator, Bigtable emulator, Firestore emulator).

## Safe Outputs

When you successfully complete your work:
- If you find any updates related to emulators since the last check, use the `create-issue` safe output.
  - The issue should include the version numbers of the SDK and the specific emulators updated.
  - A summary of the changes, bug fixes, or new features for the emulators.
  - A link to the original announcement.
  - Title the issue: "[emulator status] Google Cloud SDK Emulator Updates".
- **If there was nothing to be done** (no emulator updates found): Call the `noop` safe output with a clear message explaining that you completed the analysis but no action was necessary. This is important for transparency—it signals that you worked successfully AND consciously determined no output was needed.
