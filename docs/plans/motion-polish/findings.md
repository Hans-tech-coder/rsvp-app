# Findings (written by T01, read by T03–T07 and T12)

## Baseline (T01, production build, 375×812)

| Scenario | CLS | Top shifts (value → node) | Long tasks > 50 ms | Slow frames / total |
| --- | --- | --- | --- | --- |
| S1 cold load → Welcome | | | | |
| S2 Welcome → Our Story | | | | |
| S3 scroll Our Story | | | | |
| S4 menu → Gallery, circular gallery | | | | |
| S5 back button chain | | | | |

Real-phone check (one line):

## Hypotheses (ranked by evidence)

Status per row: confirmed · refuted · untested. Each confirmed row names the fix
task (T03–T06) that owns it.

| # | Hypothesis | Evidence | Status | Owner task |
| --- | --- | --- | --- | --- |

## Parking lot

Out-of-scope issues found during any task. One line each, with `file:line`.
