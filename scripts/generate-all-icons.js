import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE_PNG = path.resolve('.aistudio/artifacts/brain/76073348-0725-483a-8116-1b38e4880efc/.tempmediaStorage/media_1792054309338_6e0fbfe2.png');

async function run() {
  if (!fs.existsSync(SOURCE_PNG)) {
    console.error('Source PNG not found at', SOURCE_PNG);
    process.exit(1);
  }

  const rawBuffer = fs.readFileSync(SOURCE_PNG);
  const metadata = await sharp(rawBuffer).metadata();
  console.log('Source image loaded:', metadata.width, 'x', metadata.height);

  // 1. Overlay seamless "ادمن" typography in Arabic onto the 512x512 logo
  const overlaySvg = `
  <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Gradient matching card surface -->
      <linearGradient id="topCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="#fcfdfe"/>
        <stop offset="100%" stop-color="#f5f7fa"/>
      </linearGradient>

      <!-- Gradient matching 3D pill surface -->
      <linearGradient id="pillSurface" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="35%" stop-color="#f5f7fa"/>
        <stop offset="100%" stop-color="#e1e6ed"/>
      </linearGradient>

      <!-- Soft blend mask for top rect to eliminate any hard edges -->
      <filter id="blurPatch" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
    
    <!-- Feathered patch covering old text completely -->
    <rect x="86" y="72" width="100" height="38" rx="8" fill="url(#topCardGrad)" filter="url(#blurPatch)"/>
    <rect x="90" y="76" width="92" height="30" rx="6" fill="url(#topCardGrad)"/>
    
    <!-- Crisp bold Arabic text 'ادمن' -->
    <text x="136" y="99" font-family="Lemonada, sans-serif" font-size="23" font-weight="800" fill="#243447" text-anchor="middle">ادمن</text>

    <!-- Bottom-right pill badge: clean seamless cover and crisp text -->
    <rect x="313" y="393" width="128" height="33" rx="14" fill="url(#pillSurface)"/>
    <text x="377" y="417" font-family="Lemonada, sans-serif" font-size="19" font-weight="800" fill="#243447" text-anchor="middle">ادمن</text>
  </svg>
  `;

  // Apply overlay onto base 512x512
  const edited512Buffer = await sharp(rawBuffer)
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  // 2. Generate master 1024x1024 buffer
  const masterBuffer = await sharp(edited512Buffer)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 3. Generate embedded SVG for vector consumers
  const base64Png = masterBuffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Png}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>`;

  fs.writeFileSync('public/orderi-admin-logo.svg', svgContent, 'utf8');
  fs.writeFileSync('src/assets/orderi-logo.svg', svgContent, 'utf8');
  fs.writeFileSync('public/favicon.svg', svgContent, 'utf8');

  // 4. Targets for web and app assets
  const targets = [
    // Web / PWA / App assets
    { path: 'public/orderi-admin-logo.png', size: 512 },
    { path: 'public/orderi-admin-logo-512.png', size: 512 },
    { path: 'public/orderi-admin-logo-192.png', size: 192 },
    { path: 'public/pwa-512x512.png', size: 512 },
    { path: 'public/pwa-192x192.png', size: 192 },
    { path: 'public/apple-touch-icon.png', size: 180 },
    { path: 'public/favicon.png', size: 64 },
    { path: 'public/favicon-32.png', size: 32 },
    { path: 'public/natan-logo.png', size: 512 },
    { path: 'src/assets/orderi-logo.png', size: 512 },
    { path: 'src/assets/natan-logo.png', size: 512 },
    { path: 'src/assets/hero.png', size: 512 },

    // Android Mipmaps
    { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', size: 48 },
    { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', size: 48 },
    { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', size: 108 },
    { path: 'android/app/src/main/res/mipmap-mdpi/natan_admin.png', size: 48 },
    { path: 'android/app/src/main/res/mipmap-mdpi/natan_admin_round.png', size: 48 },

    { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', size: 72 },
    { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', size: 72 },
    { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', size: 162 },
    { path: 'android/app/src/main/res/mipmap-hdpi/natan_admin.png', size: 72 },
    { path: 'android/app/src/main/res/mipmap-hdpi/natan_admin_round.png', size: 72 },

    { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', size: 96 },
    { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', size: 96 },
    { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', size: 216 },
    { path: 'android/app/src/main/res/mipmap-xhdpi/natan_admin.png', size: 96 },
    { path: 'android/app/src/main/res/mipmap-xhdpi/natan_admin_round.png', size: 96 },

    { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', size: 144 },
    { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
    { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', size: 324 },
    { path: 'android/app/src/main/res/mipmap-xxhdpi/natan_admin.png', size: 144 },
    { path: 'android/app/src/main/res/mipmap-xxhdpi/natan_admin_round.png', size: 144 },

    { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
    { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
    { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', size: 432 },
    { path: 'android/app/src/main/res/mipmap-xxxhdpi/natan_admin.png', size: 192 },
    { path: 'android/app/src/main/res/mipmap-xxxhdpi/natan_admin_round.png', size: 192 },
  ];

  for (const t of targets) {
    const dir = path.dirname(t.path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await sharp(masterBuffer)
      .resize(t.size, t.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(t.path);
  }

  // PWA Maskable Icon (inset by 15% to guarantee safe zone)
  const maskableInner = await sharp(masterBuffer)
    .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 9, g: 13, b: 22, alpha: 1 }
    }
  })
    .composite([{ input: maskableInner, gravity: 'center' }])
    .png()
    .toFile('public/pwa-maskable-512x512.png');

  // Favicon.ico (32x32 PNG-based ICO)
  const fav32 = await sharp(masterBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync('public/favicon.ico', fav32);

  // 5. Android Splash screens (Dark `#090d16` background with centered logo)
  const splashTargets = [
    { p: 'android/app/src/main/res/drawable/splash.png', w: 480, h: 800, logoSize: 220 },
    { p: 'android/app/src/main/res/drawable-port-mdpi/splash.png', w: 320, h: 480, logoSize: 150 },
    { p: 'android/app/src/main/res/drawable-port-hdpi/splash.png', w: 480, h: 800, logoSize: 220 },
    { p: 'android/app/src/main/res/drawable-port-xhdpi/splash.png', w: 720, h: 1280, logoSize: 320 },
    { p: 'android/app/src/main/res/drawable-port-xxhdpi/splash.png', w: 960, h: 1600, logoSize: 420 },
    { p: 'android/app/src/main/res/drawable-port-xxxhdpi/splash.png', w: 1280, h: 1920, logoSize: 540 },
    { p: 'android/app/src/main/res/drawable-land-mdpi/splash.png', w: 480, h: 320, logoSize: 150 },
    { p: 'android/app/src/main/res/drawable-land-hdpi/splash.png', w: 800, h: 480, logoSize: 220 },
    { p: 'android/app/src/main/res/drawable-land-xhdpi/splash.png', w: 1280, h: 720, logoSize: 320 },
    { p: 'android/app/src/main/res/drawable-land-xxhdpi/splash.png', w: 1600, h: 960, logoSize: 420 },
    { p: 'android/app/src/main/res/drawable-land-xxxhdpi/splash.png', w: 1920, h: 1280, logoSize: 540 },
  ];

  for (const s of splashTargets) {
    const dir = path.dirname(s.p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const logoBuf = await sharp(masterBuffer)
      .resize(s.logoSize, s.logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 9, g: 13, b: 22, alpha: 1 }
      }
    })
      .composite([{ input: logoBuf, gravity: 'center' }])
      .png()
      .toFile(s.p);
  }

  console.log('Successfully generated all icons and splash screens with Arabic ادمن typography!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
