# Pull Request Triage Workflow

The triage ritual helps us keep the swarm focused on active, high-signal pull requests. Use the `triage:prs` npm script to assemble a snapshot of every open PR and the recommended follow-up action.

```bash
npm run triage:prs -- --repo owner/repo --output reports/pr-triage.md
```

## Inputs

- `--repo` (**required**): the GitHub slug (for example `adgenxai/core`). Defaults to the `GITHUB_REPOSITORY` environment variable if set.
- `--token`: GitHub token used to raise the rate limit ceiling. Falls back to `GITHUB_TOKEN`.
- `--stale-days`: Overrides the 90 day stale threshold.
- `--inactive-days`: Overrides the 30 day "needs author nudge" threshold.
- `--recent-days`: Reserved for future heuristics. Defaults to 14.
- `--output`: Path for the generated Markdown report. Parent folders will be created as needed.

> [!NOTE]
> Without a token the script still works for public repositories, but GitHub will enforce a lower rate limit.

## Output

The generated Markdown contains:

- A summary table that counts PRs per triage bucket.
- A detailed table with CI status, review signals, timestamps, and the recommended action.
- Suggested actions:
  - `queue-for-merge`
  - `request-review`
  - `wait-for-ci`
  - `request-fix`
  - `confirm-status`
  - `comment-to-close`
  - `manual-review`

The checklist is intentionally reversible—comment before closing or merging.

## Operational Notes

- The script uses GitHub's REST API (`pulls`, `reviews`, and `commits/status`) to minimize surprises.
- Each reviewer only counts once—their latest review decision wins.
- WIP signals are inferred from draft status or labels containing `wip`.
- Reports are timestamped so they can be attached to CodexReplay overlays or StudioShare threads.

## Example

Running against this repository with an authenticated token:

```bash
GITHUB_TOKEN=ghp_example npm run triage:prs -- --repo adgenxai/adgenxai --output reports/pr-triage-$(date +%Y%m%d).md
```

You'll see the rendered Markdown in the console and written to the `reports/` directory. Attach the artifact to the swarm changelog so future keepers can trace the lineage.
