# Automerge Workflow Documentation

## Overview

The automerge workflow automatically merges pull requests from authorized users when all CI checks pass successfully. This helps maintain a smooth development flow by reducing manual merge operations for approved changes.

## How It Works

1. **Trigger Conditions**: The workflow triggers when:
   - The CI workflow completes successfully
   - A PR review is submitted
   - Manual workflow dispatch (for debugging)

2. **Merge Requirements**:
   - All CI checks must pass (enforced by the CI workflow completion trigger)
   - PR must be created by an authorized user (configured in the workflow)
   - PR must NOT have blocking labels: `do not merge`, `work in progress`, `wip`, or `hold`

3. **Merge Behavior**:
   - Uses **squash merge** to keep history clean
   - Automatically deletes the branch after merge
   - Retries up to 3 times if merge fails
   - Updates PR with base branch changes before merging

## Configuration

### Setting Up Authorized Users

**IMPORTANT**: You must configure the authorized users in the workflow file:

1. Open `.github/workflows/automerge.yml`
2. Find the line: `MERGE_FILTER_AUTHOR: "your-github-username"`
3. Replace `your-github-username` with your actual GitHub username
4. To add multiple users, separate with commas: `"user1,user2,user3"`

Example:
```yaml
MERGE_FILTER_AUTHOR: "johndoe,janedoe,bot-account"
```

## Usage

### Automatic Merging

If you're an authorized user:
1. Create a PR as normal
2. Ensure all CI checks pass
3. The PR will automatically merge without needing any labels

### To Prevent Automerge

Add any of these labels to your PR:
- `do not merge`
- `work in progress`
- `wip`
- `hold`

### Configuration Details

The workflow uses these settings:
- **Merge Method**: Squash (combines all commits into one)
- **Branch Deletion**: Automatic after merge
- **Retry Logic**: 3 attempts with 10-second delays
- **Required Approvals**: 0 (relies on CI checks and user authorization)
- **User Filter**: Only PRs from configured users will auto-merge

## Workflow File Location

The automerge workflow is defined in: `.github/workflows/automerge.yml`

## Troubleshooting

If automerge isn't working:
1. Check that all CI checks have passed
2. Verify your username is in the `MERGE_FILTER_AUTHOR` list
3. Ensure no blocking labels are present
4. Check the Actions tab for workflow run logs
5. The workflow logs will show the current PR author for debugging

## Security

The workflow uses the built-in `GITHUB_TOKEN` with appropriate permissions:
- `contents: write` - To merge PRs
- `pull-requests: write` - To update PR status
- `issues: write` - To manage labels
- `checks: read` - To verify CI status

Only PRs from explicitly authorized users will be automatically merged, providing an additional security layer.