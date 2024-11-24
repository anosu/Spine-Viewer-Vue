# Spine-Viewer-Vue

Version rewritten with Vue.js of [Spine Viewer](https://github.com/anosu/Spine-Viewer)

**Supported spine version: 3.7, 3.8, 4.0, 4.1**

For spine < 3.7 support is limited

**支持的spine版本：3.7, 3.8, 4.0, 4.1**

对于spine 3.7以下的版本支持有限

Use [Electron](https://www.electronjs.org) + [Vue.js](https://vuejs.org/)
and [Pixi.js](https://github.com/pixijs/pixijs) + [Pixi-Spine](https://github.com/pixijs/spine)

Support multi spine files.

Support exporting animation as GIF/MP4 with embedded ffmpeg.

## Usage

- Drag your skel/json file into the window or select in explorer.
- Add animations to (Animation) Queue if you want to export them. The queue will be played when exporting.
- What you see is what you get in most cases.

## Download

[Release](https://github.com/anosu/Spine-Viewer-Vue/releases)

## Build

```
npm i
npm run build
```