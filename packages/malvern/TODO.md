# Malvern follow-ups

The GameDay/team workspace delivered in PR #218 is usable and safe to merge. These items are intentionally deferred rather than blockers for the current release.

## Deployment verification

- Verify the daily GameDay cron in the deployed Cloudflare environment, including its approximately 5:15am AEST / 6:15am AEDT execution time.
- Run an authenticated smoke test after deployment for a second team in addition to U14 Boys.
- Confirm the first deployed migration and scheduled sync preserve existing fixtures, reports, photos, roster edits, and manual statistics.

## Sync observability and reliability

- Add durable sync-run records containing trigger, organization/team scope, status, timestamps, fixture/roster counts, and typed failure details.
- Show the latest successful and failed sync on team pages. The current “last updated” value is derived from fixture timestamps.
- Prevent overlapping manual and scheduled syncs for the same team or competition.
- Add operational alerting for repeated GameDay parser failures or stale cached standings.

## Statistics

- Add optional historical-season selection. The current team statistics and standings UI targets the current GameDay season.
- Consider importing GameDay’s per-game player goals and assists from Match Centre pages. Current GameDay player totals remain clearly separate from manually entered per-fixture statistics to avoid double counting.
- Add reconciliation tools for ambiguous duplicate-name roster matches instead of leaving them only in the sync result count.

## Product follow-ups

- Replace report-recipient administration with the planned Updates/Followers model.
- Support immediate and weekly report-update delivery preferences.
- Link notification messages back to the in-app fixture/report page.

## Validation debt

- The full workspace test command still has an unrelated intermittent CLI `--help` timeout. Continue using focused Core/API/Malvern validation until that harness issue is fixed.
