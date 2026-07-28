// @ts-nocheck
// apps/backend/src/modules/admin/services/banner-generator.service.ts
// Server-side image compositor: renders a BannerTemplate + its BannerLayers
// into a PNG/WebP/JPG Buffer using Sharp.
//
// Layer rendering strategy:
//  - background : handled by the root canvas colour / image
//  - image      : download URL → composite at (x,y,w,h)
//  - text        : SVG foreignObject → composite full-canvas overlay
//  - button      : SVG foreignObject → composite full-canvas overlay
//
// NOTE: All image URLs are fetched via native fetch() (Node 18+).
//       Sharp must be installed (^0.33.x).  Never call new PrismaClient().
'use strict';

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

// ── Type aliases (runtime JS but documented for IDE support) ─────────────────
/**
 * @typedef {{
 *   id: string; type: string; name: string;
 *   data: Record<string,any> | null;
 *   x: number; y: number;
 *   width: number|null; height: number|null;
 *   zIndex: number;
 * }} Layer
 *
 * @typedef {{
 *   id: string; name: string; width: number; height: number;
 *   background: string|null; layers: Layer[];
 * }} Template
 */

/**
 * Download an image from a URL and return it as a Buffer.
 * Uses the global `fetch` available in Node 18+.
 */
async function fetchImageBuffer(url) {
  if (url.startsWith('/') || url.startsWith('uploads/') || url.startsWith('./')) {
    // Local filesystem path
    const absPath = path.resolve(process.cwd(), url.replace(/^\//, ''));
    return fs.readFileSync(absPath);
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.statusText}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * Build an SVG string whose <foreignObject> renders a styled <div>.
 * Using foreignObject means we get CSS layout (word-wrap, border-radius, padding)
 * for free — Sharp renders it via librsvg.
 */
function buildTextSvg(canvasW, canvasH, x, y, data) {
  const fontSize        = data.fontSize || 24;
  const color           = data.color || '#ffffff';
  const bg              = data.backgroundColor || 'transparent';
  const padding         = data.padding || 10;
  const fontWeight      = data.fontWeight || 'normal';
  const textAlign       = data.textAlign || 'left';
  const shadow          = data.shadow ? `text-shadow: 2px 2px 4px rgba(0,0,0,0.6);` : '';
  const text            = (data.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const maxW            = canvasW - x;
  const maxH            = canvasH - y;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}">
<foreignObject x="${x}" y="${y}" width="${maxW}" height="${maxH}">
<div xmlns="http://www.w3.org/1999/xhtml"
  style="font-size:${fontSize}px;color:${color};background:${bg};padding:${padding}px;
         font-weight:${fontWeight};text-align:${textAlign};font-family:Arial,sans-serif;
         display:inline-block;max-width:100%;word-wrap:break-word;box-sizing:border-box;${shadow}">
${text}
</div>
</foreignObject>
</svg>`;
}

function buildButtonSvg(canvasW, canvasH, x, y, data) {
  const bg           = data.backgroundColor || '#0064e0';
  const textColor    = data.textColor || '#ffffff';
  const borderRadius = data.borderRadius || 8;
  const paddingX     = data.paddingX || 20;
  const paddingY     = data.paddingY || 12;
  const fontSize     = data.fontSize || 16;
  const text         = (data.text || 'Click').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const maxW         = canvasW - x;
  const maxH         = canvasH - y;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}">
<foreignObject x="${x}" y="${y}" width="${maxW}" height="${maxH}">
<div xmlns="http://www.w3.org/1999/xhtml"
  style="display:inline-block;background:${bg};color:${textColor};
         padding:${paddingY}px ${paddingX}px;border-radius:${borderRadius}px;
         font-size:${fontSize}px;font-weight:bold;font-family:Arial,sans-serif;
         text-align:center;white-space:nowrap;">
${text}
</div>
</foreignObject>
</svg>`;
}

/**
 * Render a single layer into a Sharp OverlayOptions object.
 * Returns null if the layer should be skipped (e.g. background already set on canvas).
 *
 * @param {Layer} layer
 * @param {Record<string,any>} variantData   override values keyed by layer id
 * @param {Template} template
 * @returns {Promise<import('sharp').OverlayOptions | null>}
 */
async function renderLayer(layer, variantData, template) {
  // Merge variant overrides: variant data can patch any field inside layer.data
  const data = Object.assign({}, layer.data || {}, variantData[layer.id] || {});

  switch (layer.type) {
    case 'background':
      // Background is applied at canvas creation — nothing to composite.
      return null;

    case 'image': {
      const src = data.src;
      if (!src) return null;
      const buf   = await fetchImageBuffer(src);
      const meta  = await sharp(buf).metadata();
      const w     = Math.round(layer.width  || meta.width  || 200);
      const h     = Math.round(layer.height || meta.height || 200);
      const resized = await sharp(buf).resize(w, h, { fit: 'cover' }).png().toBuffer();
      return { input: resized, left: Math.round(layer.x), top: Math.round(layer.y) };
    }

    case 'text': {
      if (!data.text) return null;
      const svg = buildTextSvg(template.width, template.height, Math.round(layer.x), Math.round(layer.y), data);
      return { input: Buffer.from(svg), left: 0, top: 0 };
    }

    case 'button': {
      const svg = buildButtonSvg(template.width, template.height, Math.round(layer.x), Math.round(layer.y), data);
      return { input: Buffer.from(svg), left: 0, top: 0 };
    }

    default:
      return null;
  }
}

/**
 * Render a full template to a Buffer.
 *
 * @param {Template} template
 * @param {Record<string,any>} variantData   keyed by layer id OR global text/color keys
 * @param {'png'|'jpg'|'webp'} format
 * @returns {Promise<Buffer>}
 */
async function renderTemplate(template, variantData = {}, format = 'png') {
  // 1. Build base canvas.  Background can be a colour string or image URL.
  let baseCanvas;
  const bg = template.background || '#ffffff';

  if (bg.startsWith('http') || bg.startsWith('/') || bg.startsWith('uploads/')) {
    // Background is an image
    const buf = await fetchImageBuffer(bg);
    baseCanvas = sharp(buf).resize(template.width, template.height, { fit: 'cover' });
  } else {
    // Background is a hex/rgb colour
    baseCanvas = sharp({
      create: { width: template.width, height: template.height, channels: 4, background: bg },
    });
  }

  // 2. Sort layers by zIndex ascending
  const sorted = [...template.layers].sort((a, b) => a.zIndex - b.zIndex);

  // 3. Render each layer
  const overlays = [];
  for (const layer of sorted) {
    const overlay = await renderLayer(layer, variantData, template);
    if (overlay) overlays.push(overlay);
  }

  // 4. Composite
  if (overlays.length > 0) {
    baseCanvas = baseCanvas.composite(overlays);
  }

  // 5. Encode
  if (format === 'webp') return baseCanvas.webp({ quality: 85 }).toBuffer();
  if (format === 'jpg' || format === 'jpeg') return baseCanvas.jpeg({ quality: 85 }).toBuffer();
  return baseCanvas.png().toBuffer();
}

module.exports = { renderTemplate };
