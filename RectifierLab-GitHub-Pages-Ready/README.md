# RectifierLab — Power Electronics Studio

An interactive educational simulator for power-electronics rectifier circuits. Explore circuit schematics, waveforms, and simulation parameters in your browser.

## Features

- Interactive rectifier simulator UI
- Circuit schematics and waveform displays
- Simulation controls and presets
- Theory and waveform-analysis panels

## Run locally

**Requirements:** Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Vite will print a local development URL in the terminal.

Create a production build locally with:

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Create a **public** GitHub repository named **`RectifierLab`**.
2. Upload the contents of this folder to the repository root (including the hidden `.gitignore` and `.github` folder). Do not upload only the ZIP file.
3. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. Open the **Actions** tab. The workflow builds the app and publishes it to GitHub Pages.
5. When the workflow succeeds, open **Settings → Pages** to find the published URL. It should be `https://YOUR-GITHUB-USERNAME.github.io/RectifierLab/`.

### If your repository has a different name

Update `base` in `vite.config.ts` from `/RectifierLab/` to `/<your-repository-name>/`, then commit and push the change. Keep `/` for local development; the GitHub Actions build automatically uses the configured project path.

## Environment variables and API keys

The static GitHub Pages deployment does not run a private backend. Do not put API keys or secrets in frontend source code or commit them to GitHub. If you later add features that require a secret Gemini API key or a server-side API, deploy that backend separately and call it from the frontend.

`.env.example` is a template only. Copy it to `.env.local` for local development if you add code that reads those variables. Never commit real secrets.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS

## License

No license has been specified yet. Unless you add a license file, reuse and redistribution remain subject to the applicable copyright rules.
