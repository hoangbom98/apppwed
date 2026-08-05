# Image Standards — LKVIP Group Ecosystem

> **Status**: Official — applies to all Vite SPAs (Hub, Game, Trading, Dating, Sports, Admin Dashboard, Banking, Store, Academy) and the shared `@lkvip/ui` component library.
> Last updated: 2025

---

## 1. General Principles

| Principle | Rule |
|---|---|
| **Fixed aspect ratios** | Every image type has one canonical aspect ratio. Never deviate from it. |
| **Mobile-first sizing** | Source dimensions are calculated for mobile. Desktop scales up, ratio preserved. |
| **Preferred format** | WebP/AVIF — compress on upload via Sharp. Fallback: PNG/JPG for legacy browsers. |
| **Max file size at rest** | Banner < 200 KB · Thumbnail < 50 KB · Avatar < 30 KB · Icon < 10 KB |
| **Responsive delivery** | Use `srcset` + `sizes`, or the shared `<ResponsiveImage>` component from `@lkvip/ui`. |
| **Performance** | `loading="lazy"` on all below-fold images. Preload the hero banner for LCP. Serve via CDN. |
| **object-fit** | Use `cover` for banners, avatars, thumbnails. Use `contain` for logos, icons. |
| **SVG first** | Logos, favicons, and functional icons must be SVG. Raster fallback only when unavoidable. |

---

## 2. Standard Dimensions Table

| Type | Source size (px) | Aspect ratio | Display — Desktop | Display — Mobile | Notes |
|---|---|---|---|---|---|
| **Logo** | 400 × 120 | ~3.3 : 1 | 200 × 60 | 120 × 36 | SVG preferred. Used in header of all apps. |
| **Favicon** | 64 × 64 | 1 : 1 | 32 × 32 | 32 × 32 | Export also at 32 × 32 and 16 × 16. |
| **Avatar — user** | 400 × 400 | 1 : 1 | 64 × 64 | 48 × 48 | Circular crop. Store source at 400 × 400. |
| **Avatar — game / team logo** | 200 × 200 | 1 : 1 | 128 × 128 | 74 × 74 | Grid game icon, sports team badge. |
| **Banner — hero / slider** | 1920 × 640 (desktop) · 640 × 320 (mobile) | 3 : 1 (desktop) · 2 : 1 (mobile) | 1920 × 640 | 640 × 320 | Two separate source files. Crop-safe zone: centre 60%. |
| **Banner — card / promotion** | 800 × 533 | 3 : 2 | 600 × 400 | 300 × 200 | Used in promo cards, in-page banners. |
| **Banner — popup** | 600 × 400 | 3 : 2 | 600 × 400 | 340 × 227 | Centred overlay. Allow 16 px bleed on sides. |
| **Thumbnail — game / product** | 400 × 400 | 1 : 1 | 200 × 200 | 150 × 150 | Grid lists. Use `object-fit: cover`. |
| **Image — product detail** | 800 × 800 | 1 : 1 | 800 × 800 | 400 × 400 | Zoom-preview gallery. |
| **Image — article / news** | 1200 × 630 | ~1.9 : 1 | 1200 × 630 | 600 × 315 | Also used as OG/Twitter card image. |
| **Image — article thumbnail** | 400 × 300 | 4 : 3 | 400 × 300 | 300 × 225 | List-view card illustration. |
| **Background** | 1920 × 1080 | 16 : 9 | 1920 × 1080 | 640 × 360 | `background-size: cover; background-position: center`. |
| **QR Code** | 300 × 300 | 1 : 1 | 300 × 300 | 300 × 300 | Never scale below 200 × 200 to remain scannable. |
| **Icon — functional** | 64 × 64 | 1 : 1 | 24 × 24 / 32 × 32 | 24 × 24 | Use Lucide React SVG. Raster only as last resort. |
| **Image — support / guide** | 600 × 400 | 3 : 2 | 600 × 400 | 300 × 200 | Tutorial and help-centre illustrations. |
| **Badge — VIP member** | 400 × 400 | 1 : 1 | 400 × 400 | 200 × 200 | VIP card / tier badge display. |
| **Image — sports event** | 800 × 500 | 16 : 10 | 800 × 500 | 400 × 250 | Match preview, league banner. |
| **Image — trade / market** | 1200 × 800 | 3 : 2 | 1200 × 800 | 600 × 400 | Market overview, trading interface header. |
| **Image — dating profile** | 800 × 800 | 1 : 1 | 800 × 800 | 400 × 400 | Profile photo gallery. |

---

## 3. Per-Project Quick Reference

### Game
| Usage | Size | Ratio |
|---|---|---|
| Game grid thumbnail | 400 × 400 | 1 : 1 |
| Promotion banner (card) | 800 × 533 | 3 : 2 |
| Popup promotion | 600 × 400 | 3 : 2 |
| Hero slider (desktop) | 1920 × 640 | 3 : 1 |
| Hero slider (mobile) | 640 × 320 | 2 : 1 |

### Hub
| Usage | Size | Ratio |
|---|---|---|
| User avatar | 400 × 400 | 1 : 1 |
| Article featured image | 400 × 300 | 4 : 3 |
| Article OG image | 1200 × 630 | 1.9 : 1 |
| Event banner (desktop) | 1920 × 640 | 3 : 1 |
| Event banner (mobile) | 640 × 320 | 2 : 1 |

### Dating
| Usage | Size | Ratio |
|---|---|---|
| Profile photo | 800 × 800 | 1 : 1 |
| Profile gallery thumb | 400 × 400 | 1 : 1 |
| Promo banner | 800 × 533 | 3 : 2 |

### Sports
| Usage | Size | Ratio |
|---|---|---|
| Match / event preview | 800 × 500 | 16 : 10 |
| Team / league logo | 200 × 200 | 1 : 1 |
| Tournament banner | 1920 × 600 | ~3.2 : 1 |

### Trade
| Usage | Size | Ratio |
|---|---|---|
| Crypto / asset icon | 64 × 64 | 1 : 1 |
| Market header image | 1200 × 800 | 3 : 2 |
| Charts | SVG / canvas — no raster dimension |

### Admin Dashboard
| Usage | Size | Ratio |
|---|---|---|
| Admin logo | 400 × 120 | ~3.3 : 1 |
| User avatar (table) | source 400 × 400 · display 40 × 40 | 1 : 1 |
| Dashboard banner | 1920 × 640 | 3 : 1 |

---

## 4. Shared Components — `@lkvip/ui`

### 4.1 `<ResponsiveImage>` — `packages/ui/src/components/ResponsiveImage.tsx`

```tsx
interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio: '1:1' | '16:9' | '3:2' | '4:3' | '2:1' | '16:10';
  sizes?: string;
  className?: string;
}

const aspectRatioMap: Record<ResponsiveImageProps['aspectRatio'], string> = {
  '1:1':   'aspect-square',
  '16:9':  'aspect-video',
  '3:2':   'aspect-[3/2]',
  '4:3':   'aspect-[4/3]',
  '2:1':   'aspect-[2/1]',
  '16:10': 'aspect-[16/10]',
};

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src, alt, aspectRatio, sizes, className,
}) => (
  <div className={`relative overflow-hidden ${aspectRatioMap[aspectRatio]} ${className ?? ''}`}>
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
      sizes={sizes ?? '100vw'}
    />
  </div>
);

export default ResponsiveImage;
```

### 4.2 `<UserAvatar>` — `packages/ui/src/components/UserAvatar.tsx`

```tsx
// Admin Dashboard: wrap AntD Avatar. User SPAs: plain img/div.
import { Avatar } from 'antd';
import { UserRound } from 'lucide-react';

interface UserAvatarProps {
  src?: string;
  name?: string;
  size?: number | 'small' | 'default' | 'large';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, size = 'default' }) => (
  <Avatar
    src={src}
    size={size}
    icon={!src ? <UserRound size={16} /> : undefined}
  >
    {!src && name ? name.charAt(0).toUpperCase() : null}
  </Avatar>
);

export default UserAvatar;
```

### 4.3 Ant Design `<Image>` usage (Admin Dashboard)

```tsx
import { Image } from 'antd';

// Game thumbnail in a grid
<Image
  width={200}
  height={200}
  src={game.thumbnail}
  alt={game.name}
  preview={false}
  style={{ objectFit: 'cover', borderRadius: 8 }}
/>
```

### 4.4 `srcset` pattern for responsive delivery

```tsx
<img
  src={`${baseUrl}-800w.webp`}
  srcSet={`${baseUrl}-400w.webp 400w, ${baseUrl}-800w.webp 800w, ${baseUrl}-1200w.webp 1200w`}
  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
  alt="..."
  loading="lazy"
/>
```

---

## 5. File Naming Convention

```
{projectKey}_{type}_{identifier}_{widthxheight}.{ext}
```

| Token | Values |
|---|---|
| `projectKey` | `game` · `hub` · `dating` · `sports` · `trade` · `admin` |
| `type` | `banner` · `thumbnail` · `avatar` · `logo` · `icon` · `bg` · `article` · `popup` · `qr` · `vip` |
| `identifier` | slug, ID, or descriptive name in kebab-case |
| `widthxheight` | e.g. `1920x640` · `400x400` |
| `ext` | `webp` (default) · `svg` · `png` · `jpg` |

**Examples:**
```
game_banner_home-slider_1920x640.webp
hub_avatar_user-123_400x400.webp
dating_profile_456_800x800.webp
sports_banner_premier-league_800x500.webp
admin_logo_main_400x120.svg
```

---

## 6. Backend — Image Upload & Validation

### 6.1 Validation utility — `apps/backend/src/utils/image-validator.ts`

```typescript
import sharp from 'sharp';

export interface ImageSpec {
  minWidth: number;
  minHeight: number;
  /** String like "3/2" or "1/1" — evaluated as a fraction */
  expectedRatio: string;
  /** Tolerance: 0.05 = ±5 % */
  ratioDelta?: number;
}

export const IMAGE_SPECS: Record<string, ImageSpec> = {
  'banner-hero':       { minWidth: 1920, minHeight: 640,  expectedRatio: '3/1'   },
  'banner-card':       { minWidth:  800, minHeight: 533,  expectedRatio: '3/2'   },
  'banner-popup':      { minWidth:  600, minHeight: 400,  expectedRatio: '3/2'   },
  'thumbnail-game':    { minWidth:  400, minHeight: 400,  expectedRatio: '1/1'   },
  'avatar-user':       { minWidth:  400, minHeight: 400,  expectedRatio: '1/1'   },
  'article-og':        { minWidth: 1200, minHeight: 630,  expectedRatio: '1.9/1' },
  'background':        { minWidth: 1920, minHeight: 1080, expectedRatio: '16/9'  },
  'sports-event':      { minWidth:  800, minHeight: 500,  expectedRatio: '16/10' },
};

export async function validateImage(
  buffer: Buffer,
  specKey: keyof typeof IMAGE_SPECS,
): Promise<void> {
  const spec = IMAGE_SPECS[specKey];
  const { width = 0, height = 0 } = await sharp(buffer).metadata();

  if (width < spec.minWidth || height < spec.minHeight) {
    throw new Error(
      `Image too small: minimum ${spec.minWidth}×${spec.minHeight} px, got ${width}×${height}.`,
    );
  }

  const [num, den] = spec.expectedRatio.split('/').map(Number);
  const expected = num / den;
  const actual   = width / height;
  const delta    = spec.ratioDelta ?? 0.05;

  if (Math.abs(actual - expected) > delta) {
    throw new Error(
      `Wrong aspect ratio: expected ~${spec.expectedRatio}, got ${actual.toFixed(2)}.`,
    );
  }
}
```

### 6.2 Image processing on upload — `apps/backend/src/utils/image-processor.ts`

```typescript
import sharp from 'sharp';
import path from 'path';

export interface ProcessOptions {
  /** Target widths to generate (e.g. [400, 800, 1200]) */
  widths: number[];
  quality?: number;   // default 82
  format?: 'webp' | 'avif' | 'jpeg';
}

export async function processImage(
  buffer: Buffer,
  basePath: string,
  opts: ProcessOptions,
): Promise<string[]> {
  const { widths, quality = 82, format = 'webp' } = opts;
  const outputs: string[] = [];

  for (const w of widths) {
    const outPath = `${basePath}-${w}w.${format}`;
    await sharp(buffer)
      .resize(w, undefined, { withoutEnlargement: true })
      .toFormat(format, { quality })
      .toFile(outPath);
    outputs.push(outPath);
  }

  return outputs;
}
```

---

## 7. Performance Checklist

| Item | Action |
|---|---|
| Compress on upload | Use `sharp` at quality 80–85 % |
| WebP/AVIF conversion | Convert all uploaded JPG/PNG to WebP automatically |
| Lazy loading | Add `loading="lazy"` to all images below the fold |
| Hero preload | Add `<link rel="preload" as="image" href="...">` for hero banner |
| CDN delivery | Serve via CDN (Cloudinary, Imgix, or internal Nginx proxy with cache headers) |
| Blur-up placeholder | Generate a 20 × 20 px base64 LQIP as placeholder while loading |
| Cache headers | `Cache-Control: public, max-age=31536000, immutable` for hashed URLs |

---

## 8. Admin Upload UI Constraints (enforcement)

When building upload fields in Admin Dashboard, pass these constraints to the `<Upload>` component:

```tsx
// Example: game banner upload
<Upload
  accept=".jpg,.jpeg,.png,.webp"
  maxCount={1}
  beforeUpload={(file) => {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) message.error('File must be < 2 MB');
    return isLt2M || Upload.LIST_IGNORE;
  }}
  listType="picture-card"
>
  <div>
    <p>Game Banner</p>
    <p className="text-muted text-xs">1920 × 640 px · 3:1 · WebP/JPG · max 2 MB</p>
  </div>
</Upload>
```

Always display the required dimensions and ratio inline with the upload control.
