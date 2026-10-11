# Colorful card artwork and footer

Added glossy 3D artwork to service, transformation, journey, process, partnership, industry, goal finder, FAQ and consultation cards. Original PNGs are kept in `apps/website/public/art`; optimized WebP copies are served through Next Image with reserved dimensions and lazy loading. Existing camera, target and rocket artwork complements three new transparent illustrations.

The footer includes a consultation banner, all eight service links to their matching cards, approach/process/industry/FAQ navigation, configured contact options and privacy/terms links. Instagram, Facebook, LinkedIn and YouTube icons use URLs managed in CRM → Settings → Website. Empty profiles show accessible “profile coming soon” icons without invented destinations.

## Asset generation

Tool mode: built-in imagegen, transparent background enabled. Originals preserved in the generator directory and copied into this project. Exact prompts:

### Megaphone

Saved PNG: `apps/website/public/art/card-megaphone.png`

Create a premium 3D website card illustration, isolated on a genuinely transparent background. A coral-orange glossy megaphone with chrome rim, lavender handle, two small floating turquoise speech bubbles and a gold four-point sparkle. Large centered compact composition, square canvas, objects fully visible, polished tactile product render, soft studio lighting, crisp beautiful reflections, subtle ambient shadow only under objects, sophisticated colorful digital marketing aesthetic. No text, no logos, no background plane or rectangle. Deliver transparent PNG.

### Search browser

Saved PNG: `apps/website/public/art/card-search.png`

Create a premium 3D website card illustration, isolated on a genuinely transparent background. A glossy turquoise magnifying glass with chrome edge and lavender handle floating over a small warm ivory browser window with abstract coral and cobalt content blocks, accompanied by two small gold sparkles. Large centered compact composition on square canvas, objects fully visible, polished tactile product render, soft studio lighting, crisp beautiful reflections, subtle ambient shadow only under objects, sophisticated colorful digital marketing aesthetic. No text, no letters, no logos, no background plane or rectangle. Deliver transparent PNG.

### Creative palette

Saved PNG: `apps/website/public/art/card-palette.png`

Create a premium 3D website card illustration, isolated on a genuinely transparent background. An elegant glossy violet artist palette with coral, cyan and golden paint wells, a chrome-handled brush with coral tip crossing diagonally, a small floating turquoise geometric star and a glossy golden sphere. Large centered compact composition on square canvas, objects fully visible, polished tactile product render, soft studio lighting, crisp beautiful reflections, subtle ambient shadow only under objects, sophisticated colorful digital marketing aesthetic. No text, no letters, no logos, no background plane or rectangle. Deliver transparent PNG.

## Verification

Lint and typecheck pass. Desktop (1440 px), tablet (768 px) and mobile (390 px) previews load every image, show four footer social icons and have no horizontal overflow. Browser checks cover the service links, card expansion, FAQ, consultation validation, goal selection, pinned scroll chapters and mobile navigation. Live database persistence still depends on local Neon configuration.
