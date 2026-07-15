const fs = require('fs');
const path = require('path');

function parsePlistValue(str) {
  str = str.trim();
  if (str.startsWith('{') && str.endsWith('}')) {
    const cleaned = str.replace(/[{}]/g, '');
    const parts = cleaned.split(',').map(s => parseFloat(s.trim()));
    return parts;
  }
  return str;
}

function convertPlist(plistPath, pngName, outputPath) {
  const content = fs.readFileSync(plistPath, 'utf-8');

  const frames = {};
  const frameRegex = /<key>([^<]+\.png)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
  let match;

  while ((match = frameRegex.exec(content)) !== null) {
    const name = match[1];
    const dictContent = match[2];

    const textureRectMatch = dictContent.match(/<key>textureRect<\/key>\s*<string>([^<]+)<\/string>/);
    const textureRotatedMatch = dictContent.match(/<key>textureRotated<\/key>\s*<(true|false)\/>/);
    const spriteSizeMatch = dictContent.match(/<key>spriteSize<\/key>\s*<string>([^<]+)<\/string>/);
    const spriteSourceSizeMatch = dictContent.match(/<key>spriteSourceSize<\/key>\s*<string>([^<]+)<\/string>/);
    const spriteOffsetMatch = dictContent.match(/<key>spriteOffset<\/key>\s*<string>([^<]+)<\/string>/);

    if (!textureRectMatch) continue;

    const rect = parsePlistValue(textureRectMatch[1]);
    const rotated = textureRotatedMatch ? textureRotatedMatch[1] === 'true' : false;
    const spriteSize = spriteSizeMatch ? parsePlistValue(spriteSizeMatch[1]) : [rect[2], rect[3]];
    const spriteSourceSize = spriteSourceSizeMatch ? parsePlistValue(spriteSourceSizeMatch[1]) : spriteSize;
    const spriteOffset = spriteOffsetMatch ? parsePlistValue(spriteOffsetMatch[1]) : [0, 0];

    const frame = rotated
      ? { x: rect[0], y: rect[1], w: rect[3], h: rect[2] }
      : { x: rect[0], y: rect[1], w: rect[2], h: rect[3] };

    frames[name] = {
      frame,
      rotated,
      trimmed: (spriteSourceSize[0] !== spriteSize[0] || spriteSourceSize[1] !== spriteSize[1]),
      spriteSourceSize: {
        x: Math.round(spriteOffset[0] + (spriteSize[0] - spriteSourceSize[0]) / 2),
        y: Math.round(spriteOffset[1] + (spriteSize[1] - spriteSourceSize[1]) / 2),
        w: spriteSourceSize[0],
        h: spriteSourceSize[1],
      },
      sourceSize: { w: spriteSize[0], h: spriteSize[1] },
    };
  }

  const sizeMatch = content.match(/<key>size<\/key>\s*<string>([^<]+)<\/string>/);
  let metaSize = { w: 2048, h: 2048 };
  if (sizeMatch) {
    const s = parsePlistValue(sizeMatch[1]);
    metaSize = { w: s[0], h: s[1] };
  }

  const result = {
    frames,
    meta: {
      app: 'battle-jets-converter',
      image: pngName,
      format: 'RGBA8888',
      size: metaSize,
      scale: 1,
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Converted ${Object.keys(frames).length} frames from ${path.basename(plistPath)} → ${path.basename(outputPath)}`);
}

const sheetsDir = path.join(__dirname, '..', 'public', 'assets', 'spritesheets');

convertPlist(
  path.join(sheetsDir, 'menuTexture.plist'),
  '../ui/menuTexture.png',
  path.join(sheetsDir, 'menuTexture.json')
);

convertPlist(
  path.join(sheetsDir, 'partsTexture.plist'),
  '../ui/partsTexture.png',
  path.join(sheetsDir, 'partsTexture.json')
);
