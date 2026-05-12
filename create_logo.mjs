import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function createLogo() {
  const size = 512;
  const canvas = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 44, g: 62, b: 80, alpha: 1 } // Navy Blue matching manifest theme
    }
  })
  .composite([
    {
      input: Buffer.from(
        `<svg width="${size}" height="${size}">
          <text x="50%" y="54%" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="${size * 0.4}" fill="white" text-anchor="middle" dominant-baseline="middle">CFM</text>
        </svg>`
      ),
      top: 0,
      left: 0
    }
  ])
  .png()
  .toBuffer();

  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // Save as logo_new.png first
  await sharp(canvas).toFile(path.join(publicDir, 'logo_new.png'));
  
  // Generate others
  await sharp(canvas).resize(192, 192).toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(canvas).resize(512, 512).toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(canvas).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(canvas).resize(32, 32).toFile(path.join(publicDir, 'favicon.ico'));

  // Generate screenshots
  const createScreenshot = async (width, height, filename, text) => {
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 241, g: 245, b: 249, alpha: 1 } // slate-100 background
      }
    })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${width}" height="${height}">
            <rect width="100%" height="60" fill="#2c3e50" />
            <text x="20" y="40" font-family="Arial" font-size="24" fill="white">CFM Mobile</text>
            <text x="50%" y="50%" font-family="Arial" font-size="48" fill="#2c3e50" text-anchor="middle">${text}</text>
          </svg>`
        ),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toFile(path.join(publicDir, filename));
  };

  await createScreenshot(1280, 720, 'screenshot-desktop.png', 'Controle Financeiro Mensal');
  await createScreenshot(720, 1280, 'screenshot-mobile.png', 'CFM No seu Celular');

  console.log('Valid icons and screenshots created successfully.');
}

createLogo().catch(console.error);
