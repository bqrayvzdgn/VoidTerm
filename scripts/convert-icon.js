const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const svgPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.svg')
const pngPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.png')
const icoPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.ico')

async function convert() {
  const svgBuffer = fs.readFileSync(svgPath)

  // Generate 512x512 PNG
  await sharp(svgBuffer, { density: 300 })
    .resize(512, 512)
    .png()
    .toFile(pngPath)
  console.log('Created icon.png (512x512)')

  // Generate ICO with multiple sizes
  const sizes = [16, 32, 48, 64, 128, 256]
  const buffers = await Promise.all(
    sizes.map((size) =>
      sharp(svgBuffer, { density: 300 })
        .resize(size, size)
        .png()
        .toBuffer()
    )
  )

  // Build ICO file
  const icoBuffer = createIco(buffers, sizes)
  fs.writeFileSync(icoPath, icoBuffer)
  console.log(`Created icon.ico (${sizes.join(', ')}px)`)
}

function createIco(pngBuffers, sizes) {
  const headerSize = 6
  const dirEntrySize = 16
  const numImages = pngBuffers.length
  let offset = headerSize + dirEntrySize * numImages

  // ICO header
  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)        // reserved
  header.writeUInt16LE(1, 2)        // type: 1 = ICO
  header.writeUInt16LE(numImages, 4)

  // Directory entries
  const dirEntries = Buffer.alloc(dirEntrySize * numImages)
  for (let i = 0; i < numImages; i++) {
    const size = sizes[i] >= 256 ? 0 : sizes[i]
    const buf = pngBuffers[i]
    dirEntries.writeUInt8(size, i * dirEntrySize + 0)       // width
    dirEntries.writeUInt8(size, i * dirEntrySize + 1)       // height
    dirEntries.writeUInt8(0, i * dirEntrySize + 2)          // color palette
    dirEntries.writeUInt8(0, i * dirEntrySize + 3)          // reserved
    dirEntries.writeUInt16LE(1, i * dirEntrySize + 4)       // color planes
    dirEntries.writeUInt16LE(32, i * dirEntrySize + 6)      // bits per pixel
    dirEntries.writeUInt32LE(buf.length, i * dirEntrySize + 8)  // size
    dirEntries.writeUInt32LE(offset, i * dirEntrySize + 12)     // offset
    offset += buf.length
  }

  return Buffer.concat([header, dirEntries, ...pngBuffers])
}

convert().catch(console.error)
