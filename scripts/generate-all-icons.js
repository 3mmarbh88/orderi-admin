import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function generateAllIcons() {
  const svgPath = path.resolve('public/orderi-admin-logo.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('Master SVG not found at ' + svgPath);
    return;
  }
  const svgBuffer = fs.readFileSync(svgPath);
  const masterPng = await sharp(svgBuffer).resize(1024, 1024).png().toBuffer();

  const targets = [
    // Web / PWA
    { path: 'public/orderi-admin-logo.png', size: 512 },
    { path: 'public/orderi-admin-logo-512.png', size: 512 },
    { path: 'public/orderi-admin-logo-192.png', size: 192 },
    { path: 'public/pwa-512x512.png', size: 512 },
    { path: 'public/pwa-192x192.png', size: 192 },
    { path: 'public/pwa-maskable-512x512.png', size: 512 },
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
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await sharp(masterPng).resize(t.size, t.size).png().toFile(t.path);
  }

  console.log(`[Orderi Admin] ${targets.length} icons generated successfully.`);
}

generateAllIcons().catch(console.error);
