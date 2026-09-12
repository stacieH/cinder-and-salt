import fs from 'node:fs';
import path from 'node:path';

// Next serves these through its metadata file conventions: favicon.ico must sit
// at the top level of app/, while icon.svg and apple-icon.png get <link> tags
// generated for them.
const appDir = path.join(process.cwd(), 'src', 'app');
const read = (name: string) => fs.readFileSync(path.join(appDir, name));

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('app icons', () => {
  // The C&S monogram is set in the site's Fraunces web font, which an SVG
  // favicon cannot load, so every icon ships as a rendered PNG.
  it('ships a 192px C&S icon.png', () => {
    const png = read('icon.png');

    expect(png.subarray(0, 8)).toEqual(PNG_SIGNATURE);
    expect(png.readUInt32BE(16)).toBe(192); // IHDR width
    expect(png.readUInt32BE(20)).toBe(192); // IHDR height
  });

  it('does not ship an icon.svg that would compete with the PNG icons', () => {
    expect(fs.existsSync(path.join(appDir, 'icon.svg'))).toBe(false);
  });

  it('ships a favicon.ico holding 16, 32, and 48px PNG images', () => {
    const ico = read('favicon.ico');

    expect(ico.readUInt16LE(0)).toBe(0); // reserved
    expect(ico.readUInt16LE(2)).toBe(1); // resource type: icon

    const count = ico.readUInt16LE(4);
    const entries = Array.from({ length: count }, (_, index) => {
      const entry = 6 + index * 16;
      return {
        width: ico.readUInt8(entry) || 256,
        height: ico.readUInt8(entry + 1) || 256,
        byteLength: ico.readUInt32LE(entry + 8),
        offset: ico.readUInt32LE(entry + 12),
      };
    });

    expect(entries.map((entry) => [entry.width, entry.height])).toEqual([
      [16, 16],
      [32, 32],
      [48, 48],
    ]);
    entries.forEach((entry) => {
      expect(entry.offset + entry.byteLength).toBeLessThanOrEqual(ico.length);
      expect(ico.subarray(entry.offset, entry.offset + 8)).toEqual(PNG_SIGNATURE);
    });
  });

  it('ships a 180px apple-icon.png', () => {
    const png = read('apple-icon.png');

    expect(png.subarray(0, 8)).toEqual(PNG_SIGNATURE);
    expect(png.readUInt32BE(16)).toBe(180); // IHDR width
    expect(png.readUInt32BE(20)).toBe(180); // IHDR height
  });
});
