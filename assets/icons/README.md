# Application Icons

## Required Files
- `icon.ico` - Windows icon (256x256 minimum, ideally multi-resolution)
- `icon.icns` - macOS icon
- `icon.png` - Linux icon (512x512)

## Generate from SVG

1. Open `icon.svg` in a browser or image editor
2. Export as 512x512 PNG

### Windows (icon.ico)
Use one of these tools:
- Online: https://convertico.com/ or https://icoconvert.com/
- ImageMagick: `convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`
- Electron-icon-builder: `npx electron-icon-builder --input=icon.png --output=./`

### macOS (icon.icns)
- Use `iconutil` on macOS
- Or: `npx electron-icon-builder --input=icon.png --output=./`

### Quick Setup with electron-icon-builder
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=icon.png --output=./
```
