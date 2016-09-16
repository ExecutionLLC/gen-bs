# GIT Workflow

Please see the interactive workflow description here:

https://guides.github.com/introduction/flow/

## Branch Naming and Commits

When a new branch is created for an issue, it's name, in addition to the pieces of advice by the link above, must contain the issue number, ex. view-builder-name-fix-123. If the branch is expected to fix several issues at once (which is better to avoid), the issue number can be omitted.

Commits to the branch should contain the number of the issue they are related to, using the following syntax:

`Added check for view name max length (#123)`

This way GitHub will automatically link the commit and issue together.

## Issues

Issues should be labeled by the names of the application parts they are related to, ex. `web-server` or `frontend`. If there are several parts in issue, all labels should be added.

When issue is fixed, and pull request is created for it, it should be marked by `fixed but not checked` label.

Issue should be closed when published on the demo-server or VEP test server.

Issues waiting for some external action (ex. next prototype completion) should be labeled as `pending`.