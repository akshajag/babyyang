# Fixiverse

Fixiverse is a software-only learning workshop designed to help children who need extra support build understanding and confidence by testing examples, repairing rules, and teaching Pip.

It grew from a student team's interest in tutoring. Learning and confidence improvements are goals to evaluate, not measured results claimed by this release.

## Try it

Open `index.html` for the self-contained app. No API key, account, installation, camera or microphone is required. Browser read-aloud is optional and depends on the browser's speech service.

- Fraction Foundry: compare one piece from matching wholes and repair a mistaken rule.
- Pattern Grove: investigate repeating units and repair the rule that copies the last tile.
- Teach Pip: teach examples, challenge a simulated rule learner and inspect what the examples ruled out.
- Rule Lab: write an executable recipe, step through it and inspect finite checks of 49 fraction cases or 252 pattern cases.
- Tutor workspace: separate learner nicknames, practice suggestions, observations, guided before/after/next-day tasks, and calculated results exports.

Direct links: `#tutor`, `#session`, `#teach-fraction`, `#teach-pattern`, `#lab-fraction`, `#lab-pattern`.

## Develop and verify

Use Node.js 24 or newer. There are no npm package dependencies to install.

```sh
npm run dev
npm test
npm run build
npm run verify
```

The development server prints its local address and serves `dist/`. `npm run build` creates root `index.html`. After editing source, rebuild and commit both source and the generated page. `npm run verify` checks JavaScript syntax, relative imports, all 99 tests and whether the standalone page reproduces exactly. The included GitHub Actions workflow runs these checks; it has not been run on GitHub until you upload this repository.

## Publish with GitHub Pages

Upload the extracted contents of this folder to a repository. Root `index.html`, `dist/`, `tests/`, `scripts/`, `build-standalone.mjs`, `server.mjs`, `package.json` and this README belong at repository root, not inside another wrapping folder.

In repository Settings > Pages, select Deploy from a branch, branch `main`, folder `/(root)`, then Save. The page will be at `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. That is a template, not an already published URL. Enable hidden-file display or use GitHub Desktop/Git so `.github`, `.nojekyll` and `.gitignore` are included.

GitHub documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Architecture

Pure JavaScript engines hold learning and assessment rules separately from UI rendering:

- `engine.js`, `pattern.js`: guarded mission state transitions and fresh checks.
- `mentor.js`, `mentor-analysis.js`: finite rule hypotheses, example replay and evidence analysis.
- `rule-lab.js`: child-editable recipes, traces and finite verification.
- `session-kit.js`, `session-guidance.js`: assessment sequencing, support-aware scoring and non-answer-revealing workflow instructions.
- `profiles.js`, `save-tools.js`: per-learner local storage, backup validation and restore-as-copy.
- `scroll-model.js`, `journey-state.js`, `tour.js`: reversible native-scroll scenes and temporary preview state.
- UI modules, `mission-ui.js`, `styles.css`: keyboard focus, responsive illustrated screens, reduced-motion support and read-aloud controls.

The finite checks cover only the stated sets. Pip's simulated performance is not a child's mastery score. `docs/RELEASE-NOTES.txt` records verification and limitations.

## Privacy and limitations

Learner records stay in the current browser's storage unless someone exports them. No analytics or app data-upload service is configured. Local profiles have no access lock: use an appropriate device and keep exported records private. Clearing browser storage can remove progress; use workspace backup before moving devices. Private results, real learner names, filled workbooks and workspace backups do not belong in this repository.

Physical-device, named screen-reader and real tutoring-pilot results still need to be collected. The app is an offline pilot release, not a validated assessment or clinical tool. The next-day tasks retain their real 24-hour gate.

## Student contributions, AI assistance and attribution

This implementation and its illustration received substantial AI assistance through Codex. Do not describe this generated package as entirely student-coded. Document each student's actual technical contributions, revisions, decisions and understanding in `docs/CONTRIBUTIONS.txt`; disclose all AI use accurately in the CAC submission. No learner outcome or participant is implied by the sample interface.

The 2026 CAC rules permit disclosed AI assistance for specific aspects and require significant student technical contributions and understanding. Review the current official rulebook and your district's requirements before submission: https://www.congressionalappchallenge.us/students/rules/

No software license has been chosen for the student team. Select a license only after reviewing ownership and the rights to any assets you add.
