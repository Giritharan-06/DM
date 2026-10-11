# Reference-based visual redesign

The supplied landing-page and CRM images guide the composition, pastel colors, dimensional artwork and compact workspace layout. Sample customers, performance statistics, testimonials and logos in the references are not presented as agency facts.

The landing page includes hero artwork and parallax cards, a desktop GSAP ScrollTrigger services rail, mobile swipe navigation, animated solution/process steps, industry selection, concept cards, partnership benefits, expandable FAQs and consultation intake. Reduced motion disables scroll-driven effects. The CRM uses the authenticated employee name, real scoped records and the existing authorization rules.

Generated assets were made with the built-in imagegen tool and optimized into local WebP files:

- `apps/website/public/art/marketing-growth.webp`
- `apps/website/public/art/business-owner.webp`

Hero prompt:

> Use case: stylized 3D marketing illustration. Asset type: transparent hero artwork for an actual digital marketing agency website, not a webpage screenshot. Create a premium polished playful 3D composition: an open silver/lilac laptop facing camera at three-quarter angle, its screen showing abstract blue and violet rising bar charts and clean blank dashboard tiles; a white rocket with violet fins launching upward from behind the screen; floating colorful glass-like social communication tiles, search symbol, camera symbol, play symbol, green chat bubble; little leafy plants at bottom, floating lilac spheres and sparkles. Soft pearlescent clay material, luminous lavender and electric blue palette with coral and green accent tiles, soft studio shadows and ambient lighting, premium friendly Pixar-like product rendering, beautifully detailed, clear individual objects. Composition landscape 3:2, whole arrangement visible with generous margins, laptop centered, rocket toward upper right. Transparent background actual alpha. No words, no lettering, no numbers, no watermark. This must be usable artwork, do not include webpage layout or UI outside the laptop.

Business illustration prompt:

> Asset type: transparent 3D illustration for a premium local-business digital marketing agency website. Create a friendly young Indian business owner with sculpted dark hair, warm expressive face, wearing a blue rolled-sleeve shirt, thoughtful hopeful expression, shown waist-up at center-right. Beside him on the left a beautifully modeled miniature neighborhood shop with coral and cream striped awning, warm window display and plants. Around them float small pearlescent lilac bubbles, a lavender location pin, a blue search icon, a gold lightbulb and a rising violet bar chart. Premium softly rounded clay 3D rendering, soft studio illumination, white/lavender electric-blue palette with tasteful coral accents, meticulously polished, approachable and bright. Landscape 3:2 framing entire group visible with breathing room, actual transparent background alpha, subtle contact shadow, no lettering, text, numbers, watermark, logos or webpage UI.

Authenticated CRM visual verification still requires the configured Neon database and an agency account. Public website desktop/mobile screenshots are saved in `artifacts/`. Automated browser checks cover artwork loading, FAQ expansion, responsive overflow, reduced motion, form validation and the actual pinned-scroll behavior.

Verification for this redesign: lint, typecheck and both production builds passed. The browser suite passed 13 checks; the desktop-only pinned-scroll check was intentionally skipped in the mobile project. Desktop website, mobile website and CRM sign-in screenshots had no horizontal overflow.
