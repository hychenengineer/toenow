# Carefree Farm PixiJS pasture correction

2026-10-31, requested by the user after rejecting the SVG leg appearance.

The pasture now uses the repository's existing PixiJS 8.22.0 distribution and one WebGL canvas. Animal bodies are stable sprites; four independent textured meshes per animal deform through a small stance/swing cycle. The renderer crops away the bulky upper part of the limb texture, retunes proportions and attachment points (including the horse shoulder), and distinguishes near and far feet. Maximum local displacement is 7.2px and lift 2.2px, approximately 2.8px and 0.9px at the displayed adult scale. Ground-contact phases keep the foot at ground height. Shadow and selected ring are rendered beneath the animal in Pixi rather than over the feet in a higher DOM stacking context.

Accessible DOM selection buttons, name/gift labels, care controls, the horse migration, surprise picture receipts, economy and saves are retained. Animation freezes for pause, dialogs and hidden views; reduced motion neutralizes the leg meshes. One canvas is reused through tab switches and responsive resizing. Texture loading is completed before actors are built; failure retains selectable static animal portraits and normal care operations.

Validation on isolated preview checkout:
- npm test: 7 pretests + 240 main tests passed.
- Actual WebGL regression: 20 changing leg meshes, finite coordinates, bounded stride/lift, dialog/hidden pause, reduced motion, one canvas, desktop/mobile/landscape resize and animal selection passed.
- Farm browser 14 groups, living-farm browser 9 groups and reward browser 7 groups passed with no page errors.
- Shared farm/garden screens: 8 standalone / 2 iframe / 2 practice passed.
- Injected texture-load failure retained visible selectable animals and feeding, with no uncaught page errors.
- Inspected successive rendered stride frames and mobile/desktop screenshots. Independent review caught the shadow layering issue; it was corrected before publication.
- Physical iPad Safari remains unverified. Visual preference remains subject to the user's feedback.

Artifacts: artifacts/carefree-farm/pixi/ (stride frames, desktop/mobile/landscape images and recorded browser video).

API references used: https://pixijs.com/8.x/guides/components/application and https://pixijs.com/8.x/guides/components/scene-objects/mesh .
