# Automerge Workflow Documentation

## Overview

The automerge workflow automatically merges pull requests when all CI checks pass successfully. This helps maintain a smooth development flow by reducing manual merge operations for approved changes.

## How It Works

1. **Trigger Conditions**: The workflow triggers when:
   - The CI workflow completes successfully
   - A PR review is submitted
   - PR labels are added or removed
   - Manual workflow dispatch (for debugging)

2. **Merge Requirements**:
   - All CI checks must pass (enforced by the CI workflow completion trigger)
   - PR must have the `automerge` label
   - PR must NOT have blocking labels: `do not merge`, `work in progress`, or `wip`

3. **Merge Behavior**:
   - Uses **squash merge** to keep history clean
   - Automatically deletes the branch after merge
   - Retries up to 3 times if merge fails
   - Updates PR with base branch changes before merging

## Usage

### To Enable Automerge on a PR:

1. Ensure all CI checks are passing
2. Add the `automerge` label to your PR
3. The workflow will automatically merge when conditions are met

### To Prevent Automerge:

Add any of these labels to your PR:
- `do not merge`
- `work in progress`
- `wip`

### Configuration

The workflow uses these settings:
- **Merge Method**: Squash (combines all commits into one)
- **Branch Deletion**: Automatic after merge
- **Retry Logic**: 3 attempts with 10-second delays
- **Required Approvals**: 0 (relies on CI checks instead)

## Workflow File Location

The automerge workflow is defined in: `.github/workflows/automerge.yml`

## Troubleshooting

If automerge isn't working:
1. Check that all CI checks have passed
2. Verify the `automerge` label is present
3. Ensure no blocking labels are present
4. Check the Actions tab for workflow run logs

## Security

The workflow uses the built-in `GITHUB_TOKEN` with appropriate permissions:
- `contents: write` - To merge PRs
- `pull-requests: write` - To update PR status
- `issues: write` - To manage labels
- `checks: read` - To verify CI status