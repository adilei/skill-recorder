# Skill Recorder

Record a real work session on your screen, and turn it into a reusable **skill** or
**automation** for an AI agent. Skill Recorder captures what you did — screen video
plus activity signals — then uses the GitHub Copilot CLI to reconstruct it into a
clear **intent + ordered steps**, which you can generalize into something an agent
can repeat.

<p align="center">
  <img src="docs/images/recorder.png" alt="Skill Recorder capture window: a record button, timer, optional narration toggle, and readiness checks" width="420">
  &nbsp;&nbsp;
  <img src="docs/images/library.png" alt="Skill Recorder library: recorded sessions on the left, the reconstructed intent and ordered steps on the right" width="520">
</p>

## What it does

1. **Record** — hit record (or `⌘⇧R` / `Ctrl+Shift+R` from anywhere) and do your task.
   Skill Recorder captures the screen and your activity in the background.
2. **Analyze** — on stop, it correlates the signals and a Copilot agent reconstructs
   *what you did*: one overall intent plus an ordered list of steps. You can review
   and edit the result.
3. **Create** — from an approved analysis, generalize the one run into a:
   - **Skill** — a `SKILL.md` procedure an agent runs on demand, and
   - **Automation** — the same procedure on a schedule/trigger.

   Both prefer the agent's **native tools** (e.g. the `gh` CLI, `web_fetch`) over
   replaying UI clicks, and generalize from your single example (e.g. "submit one form
   per row" for *all* N rows, not the 3 you happened to record).

## What's captured

Everything is captured and processed **locally**. The in-app "Records your screen and
activity" panel shows exactly what's collected:

- **Window tracking** — active-app / window switches (native, via `get-windows`).
- **Browser URLs** — the page you're on (macOS, via AppleScript).
- **Screen video** — recorded with a bundled `ffmpeg`; frames are pulled only at
  meaningful moments to disambiguate the steps.
- **Clipboard** — copy/paste content that ties steps together.
- **Narration** *(optional)* — turn on **Narrate** to explain out loud; audio is
  saved immediately and can be transcribed **on-device** (Whisper via transformers.js).
  The first transcription uses an explicit, one-time ~250 MB model download.

## Requirements

- **macOS** (primary target). Core recording is also validated on Windows 11; see
  [`WINDOWS-VALIDATION.md`](WINDOWS-VALIDATION.md).
- **Node.js 22+**.
- **GitHub Copilot CLI** installed and signed in — the `copilot` command must be on
  your `PATH`. This powers the analysis and the skill/automation builders.
- `ffmpeg` is **bundled** — no separate install needed.

On first launch macOS will prompt for **Screen Recording** (required) and, if you use
Narrate, **Microphone** permission.

## Install the preview

Portable, **no-install** preview candidates are built by CI for a limited internal
preview. Grab them from the repo's **Releases** (tagged pre-releases) or, for an
untagged run, from the **Actions → Build portable candidates** run's artifacts.

These builds are **unsigned** (internal preview), so each OS shows a one-time warning:

- **macOS (Apple Silicon / arm64)** — unzip `skill-recorder-<version>-arm64.zip`, then
  **right-click the app → Open** and confirm once. If macOS still says the app is
  damaged / can't be opened, clear the quarantine flag and reopen:
  ```bash
  xattr -dr com.apple.quarantine "Skill Recorder.app"
  ```
- **Windows (x64)** — run `skill-recorder-<version>-x64.exe`. It is a single **portable**
  executable — nothing is installed. If **SmartScreen** appears, choose
  **More info → Run anyway**.

> **Signing:** these candidates are not code-signed or notarized, so the one-time bypass
> above is expected. Real signing is a shipping-time concern, not part of this preview.
>
> **Bundled ffmpeg (licensing):** the preview currently bundles a GPL `ffmpeg` build.
> Swapping it for an LGPL build is tracked in
> [#11](https://github.com/adilei/skill-recorder/issues/11); native Windows **arm64**
> packaging is tracked in [#20](https://github.com/adilei/skill-recorder/issues/20).

## Run it (development)

> Prefer a ready-to-run build? See **[Install the preview](#install-the-preview)**.
> To hack on Skill Recorder, run it from source:

```bash
npm install
npm run dev
```

`npm run dev` starts Vite and launches the Electron app with hot-reload. The app also
lives in the menu-bar tray; `⌘⇧R` (macOS) / `Ctrl+Shift+R` (Windows) toggles recording
from anywhere.

Other useful scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + production build (dist/ + dist-electron/)
npm run dist        # portable build via electron-builder (arm64 .zip on macOS, portable .exe on Windows)
npm start           # run the last build with `electron .`
```

## Evals

The variable part of the system — the Copilot **describer** and **builders** — has a
fixture-based eval suite. See [`evals/README.md`](evals/README.md).

```bash
npm run eval            # score the describer against synthetic recordings
npm run eval:builder    # score the skill/automation generalization
```

## License

[MIT](LICENSE)
