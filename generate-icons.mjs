import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const imagePath = path.resolve('public/logo_new.png');
const imageBuffer = fs.readFileSync(imagePath);

async function generate() {
  await sharp(imageBuffer)
    .resize(192, 192)
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(path.resolve('public/icon-192.png'));
    
  await sharp(imageBuffer)
    .resize(512, 512)
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(path.resolve('public/icon-512.png'));
    
  await sharp(imageBuffer)
    .resize(180, 180)
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
    
  await sharp(imageBuffer)
    .resize(512, 512)
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(path.resolve('public/logo_new.png'));
    
  console.log('Icons generated successfully with white background.');
}

generate().catch(console.error);
