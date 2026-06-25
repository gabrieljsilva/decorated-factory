# Release & pipeline security

Overview of the automated flow and the one-time setup required on GitHub and npm.

## Release flow (changesets, Release PR model)

1. On a feature branch, run `npx changeset`, describe the change and pick the bump
   (patch/minor/major). Commit the `.changeset/*.md` file together with the code.
2. Merging the feature into `master` makes the **Release** workflow open/update an
   automated **"chore: version packages"** PR (bumps the version and moves the
   changeset into the CHANGELOG). It does **not** publish yet.
3. When you want to release, **merge that PR**. Only then does Release build, tag
   and publish to npm (`decorated-factory`) with **provenance**.

## Tokenless publishing: OIDC Trusted Publishing

There is no `NPM_TOKEN` in the repository. Publishing authenticates via OIDC (a
short-lived token issued by GitHub and validated by npm). One-time setup:

1. On npmjs.com, go to the `decorated-factory` package, **Settings -> Trusted Publisher**
   and add:
   - Provider: GitHub Actions
   - Repository: `gabrieljsilva/decorated-factory`
   - Workflow: `release.yml`
2. Done. From now on every publish is OIDC, with no stored token.
   - Requires npm >= 11.5.1 on the runner (`release.yml` runs `npm install -g npm@latest`).

> The package already exists on npm, so no bootstrap publish is needed. If you ever
> recreate it from scratch, publish once manually (`npm run build && npm publish`)
> with a short-lived granular token and revoke it right after.

## Repository settings

- **Settings -> General -> Pull Requests**: enable **Allow auto-merge** (the
  Dependabot auto-merge depends on it).
- **Branch protection / ruleset on `master`**:
  - Require a pull request before merging.
  - **Require review from Code Owners** (so changes under `.github/**` need human
    approval; see `CODEOWNERS`). This only triggers on owned paths, so dependency
    updates that touch only the lockfile still auto-merge.
  - Require status checks to pass -> select the **CI / verify** check.
  - Require branches to be up to date before merging.
  - Block force pushes; require linear history.

## Security model

- **Publishing is decoupled from PR CI**: the `id-token`/publish capability exists
  only in `release.yml` (push to `master`). PR CI runs with a read-only token and
  no secrets, so untrusted code (a Dependabot update or any fork PR) never reaches
  the publish path.
- **Auto-merge never runs PR code**: the auto-merge workflow only reads metadata
  and enables auto-merge; it does not check out or execute the PR. CI validates it.
- **Actor gate**: auto-merge only for `dependabot[bot]` (authenticity guaranteed by
  GitHub) and only patch/minor. Major is always manual.
- **Cooldown** (`dependabot.yml`): holds freshly published versions for 5 days as a
  defense against a dependency compromised right after release.
- **`npm ci --ignore-scripts`**: avoids lifecycle scripts of transitive deps during
  install on CI.
- **Provenance**: consumers can verify origin with `npm audit signatures`.
