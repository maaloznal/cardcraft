# Bundle Analysis

## Methodology

Source code analysis + dependency size inspection. Production build not
run (per project constraints), but sizes are estimated from module sizes.

## Source Code

| Layer | Files | Lines | Notes |
|---|---:|---:|---|
| Core | 4 | 582 | types, constants, utils, validation |
| Infrastructure | 5 | 575 | storage, themes, export, styles |
| State | 2 | 467 | StateManager, HistoryManager |
| Rendering | 3 | 910 | PreviewRenderer, EditorRenderer, WordEditorManager |
| UI Kit | 5 | 718 | Accordion, Modal, Switch, Dropdown, index |
| Orchestrator | 9 | 1908 | CardCraftApp + 8 extracted modules |
| App | 3 | 721 | page.tsx, layout.tsx, globals.css |
| Tests | 6 | ~1100 | unit tests (not in bundle) |
| **Total src/** | **37** | **~5849** | |

## CSS

| File | Lines | Notes |
|---|---:|---|
| card-constructor.css | 3700 | 90 themes + layout + components |
| globals.css | 121 | Tailwind import + design tokens |
| **Total** | **3821** | |

## Dependencies

### Production (8 packages)

| Package | Size | In Bundle? | Notes |
|---|---:|---:|---|
| next | 157M | Framework | Next.js runtime |
| react | ~5M | Yes | React 19 |
| react-dom | 7.2M | Yes | ReactDOM 19 |
| html-to-image | 520K | **Dynamic** | Only loaded on export (download/copy) |
| @fontsource/golos-text | 712K | Yes | Font subset |
| @fontsource/lora | 2.3M | Yes | Font subset |
| @fontsource/manrope | 1.1M | Yes | Font subset |
| @fontsource/plus-jakarta-sans | 1.6M | Yes | Font subset |

### Dev (10 packages — not in bundle)

@tailwindcss/postcss, @types/react, @types/react-dom, @vitest/ui, bun-types,
eslint, eslint-config-next, tailwindcss, typescript, vitest

## Bundle Optimization

### Dynamic import for html-to-image

**Before**: `import { toPng, toBlob } from 'html-to-image'` — static import
meant html-to-image (520KB) was in the main chunk, loaded on every page
view even if the user never exports.

**After**: `const { toPng } = await import('html-to-image')` — dynamic
import. html-to-image is loaded lazily only when the user clicks
"Download" or "Copy". The main page load is ~520KB lighter.

**Expected effect**: Faster initial page load. The export functionality
has a ~200ms delay on first use (module loading), which is acceptable
given the toast feedback.

### Removed dependencies (from previous cleanup)

47 unused packages removed in P1-5:
- 30+ @radix-ui/react-* (shadcn scaffold)
- prisma + @prisma/client
- sharp
- recharts, embla-carousel-react, react-day-picker, react-resizable-panels
- react-hook-form, cmdk, vaul, sonner, next-themes
- class-variance-authority, clsx, tailwind-merge
- z-ai-web-dev-sdk
- date-fns, uuid, zod, zustand, framer-motion, next-auth, next-intl
- react-markdown, react-syntax-highlighter

## Estimated First Load

With dynamic import for html-to-image:
- Next.js framework + React: ~150KB gzipped
- App code (orchestrator + modules): ~30KB gzipped
- CSS (card-constructor.css): ~50KB gzipped
- Fonts: ~200KB (subset, loaded on demand)
- **Total first load**: ~430KB gzipped (estimated)

html-to-image (~150KB gzipped) loads only on export action.

## Recommendations (future)

1. **Font subsetting**: @fontsource packages include multiple weights.
   Consider importing only the weights actually used (400, 700).
2. **CSS splitting**: 3700-line card-constructor.css could be split into
   themes.css + layout.css + components.css. Themes could be loaded
   on demand.
3. **Tree-shaking verification**: Run `next build` with `--analyze` to
   verify no unexpected modules in the bundle.
