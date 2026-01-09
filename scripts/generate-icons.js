const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');

async function generateIcons() {
  console.log('Generating icons from SVG...');

  // Read SVG
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate PNG sizes
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512];

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
    console.log(`  Created icon-${size}.png`);
  }

  // Create main icon.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon.png'));
  console.log('  Created icon.png (512x512)');

  // Create ICO file using png-to-ico CLI
  try {
    const icon256 = path.join(iconsDir, 'icon-256.png');
    const icoPath = path.join(iconsDir, 'icon.ico');
    execSync(`npx png-to-ico "${icon256}" > "${icoPath}"`, {
      cwd: path.join(__dirname, '..'),
      shell: true
    });
    console.log('  Created icon.ico (Windows)');
  } catch (err) {
    console.log('  Warning: Could not create ICO file:', err.message);
    console.log('  electron-builder will generate it from icon.png');
  }

  console.log('\nIcons generated successfully!');
}

generateIcons().catch(console.error);
