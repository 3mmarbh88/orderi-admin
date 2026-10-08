import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const svgPath = path.join(rootDir, "public", "orderi-admin-logo.svg");

if (!fs.existsSync(svgPath)) {
  console.error("Master SVG not found at", svgPath);
  process.exit(1);
}

const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
  console.log("[Icons] Generating high-resolution web and PWA icons...");

  // 1. Web & PWA icons
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(rootDir, "public", "orderi-admin-logo.png"));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(rootDir, "public", "orderi-admin-logo-512.png"));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(rootDir, "public", "orderi-admin-logo-192.png"));
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(rootDir, "public", "favicon.png"));
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(rootDir, "public", "favicon-32.png"));

  console.log("[Icons] Generating Android mipmap launcher icons...");

  const mipmapSizes = {
    mdpi: { launcher: 48, foreground: 108 },
    hdpi: { launcher: 72, foreground: 162 },
    xhdpi: { launcher: 96, foreground: 216 },
    xxhdpi: { launcher: 144, foreground: 324 },
    xxxhdpi: { launcher: 192, foreground: 432 },
  };

  for (const [density, dims] of Object.entries(mipmapSizes)) {
    const dir = path.join(rootDir, "android", "app", "src", "main", "res", `mipmap-${density}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // ic_launcher.png (standard squircle)
    await sharp(svgBuffer)
      .resize(dims.launcher, dims.launcher)
      .png()
      .toFile(path.join(dir, "ic_launcher.png"));

    // ic_launcher_round.png (with circular mask)
    const circleMask = Buffer.from(
      `<svg width="${dims.launcher}" height="${dims.launcher}">
        <circle cx="${dims.launcher / 2}" cy="${dims.launcher / 2}" r="${dims.launcher / 2}" fill="white"/>
      </svg>`
    );

    await sharp(svgBuffer)
      .resize(dims.launcher, dims.launcher)
      .composite([{ input: circleMask, blend: "dest-in" }])
      .png()
      .toFile(path.join(dir, "ic_launcher_round.png"));

    // ic_launcher_foreground.png (for Android adaptive icons, padded to fit inside safe zone: ~72% size)
    const fgIconSize = Math.round(dims.foreground * 0.72);
    const fgPadding = Math.round((dims.foreground - fgIconSize) / 2);

    const resizedFg = await sharp(svgBuffer)
      .resize(fgIconSize, fgIconSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: dims.foreground,
        height: dims.foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resizedFg, top: fgPadding, left: fgPadding }])
      .png()
      .toFile(path.join(dir, "ic_launcher_foreground.png"));
  }

  console.log("[Icons] Generating Android splash screens...");

  const splashScreens = [
    { dir: "drawable", w: 480, h: 320 },
    { dir: "drawable-land-mdpi", w: 480, h: 320 },
    { dir: "drawable-land-hdpi", w: 800, h: 480 },
    { dir: "drawable-land-xhdpi", w: 1280, h: 720 },
    { dir: "drawable-land-xxhdpi", w: 1600, h: 960 },
    { dir: "drawable-land-xxxhdpi", w: 1920, h: 1280 },
    { dir: "drawable-port-mdpi", w: 320, h: 480 },
    { dir: "drawable-port-hdpi", w: 480, h: 800 },
    { dir: "drawable-port-xhdpi", w: 720, h: 1280 },
    { dir: "drawable-port-xxhdpi", w: 960, h: 1600 },
    { dir: "drawable-port-xxxhdpi", w: 1280, h: 1920 },
  ];

  for (const s of splashScreens) {
    const splashDir = path.join(rootDir, "android", "app", "src", "main", "res", s.dir);
    if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

    const minDim = Math.min(s.w, s.h);
    const logoSize = Math.round(minDim * 0.42);

    const logoBuf = await sharp(svgBuffer).resize(logoSize, logoSize).png().toBuffer();

    const top = Math.round((s.h - logoSize) / 2);
    const left = Math.round((s.w - logoSize) / 2);

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 9, g: 13, b: 22, alpha: 1 }, // #090d16
      },
    })
      .composite([{ input: logoBuf, top, left }])
      .png()
      .toFile(path.join(splashDir, "splash.png"));
  }

  console.log("All icons and splash screens generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Icon generation error:", err);
  process.exit(1);
});
