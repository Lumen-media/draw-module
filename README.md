# Raffle Module

A raffle/lottery module for [Lumen](https://github.com/Lumen-media/lumen).

![Raffle Configurator](https://i.imgur.com/ehGj7pm.png)

## Features

- **Multiple animation styles** — Slots (3D rotating tiles), Wheel (roulette), Picker (vertical drum)
- **Named lists** — Create and switch between saved participant lists with auto-save
- **Smart repeat control** — Mark drawn names with `*` to exclude from future draws; reset clears markers
- **Background modes** — Default (profile theme), Transparent, Card, or custom image/video via the app's media library
- **Appearance settings** — Font family (system fonts), font size, animation duration
- **Presenter screen** — Renders in the media window, reacts to the app's profile default background

### Settings

![Settings Popover](https://i.imgur.com/YilLNog.png)

### Animation Styles

| Slots | Wheel | Picker |
|-------|-------|--------|
| ![Slots](https://i.imgur.com/EdVYMNs.png) | ![Wheel](https://i.imgur.com/Y93aIyo.png) | ![Picker](https://i.imgur.com/PNwDyrS.png) |

## Usage

Install the `.lumenpack` from the [latest release](https://github.com/Lumen-media/raffle-module/releases/latest) via the Lumen module manager.

Open the **Raffle Configurator** from the **Tools** menu.

1. Type or paste participant names (one per line) in the editor — or create a named list
2. Click **Start** to open the presenter screen on the media window
3. Click **Raffle** to spin and draw a winner
4. Click **Exit** to close the presenter screen

## Release

Releases are automated via GitHub Actions. To publish a new version:

1. Go to **Actions → Release → Run workflow**
2. Enter the version number (e.g. `1.2.0`)
3. The workflow bumps `package.json` and `manifest.json`, builds the `.lumenpack`, and creates the GitHub release automatically

## Development

```bash
npm install
npm run build         # build into dist/
npm run pack          # build + create {id}-{version}.lumenpack in dist/
npm run validate      # schema-check manifest.json
npm run sync-manifest # sync version/description from package.json to manifest.json
```

To bump version locally:

```bash
npm version patch     # or minor / major
```

This runs `sync-manifest` automatically and stages `manifest.json`.

## License

MIT
