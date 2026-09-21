# LetterMilo demo motion assets

Original Milo character and animation artwork, all rights reserved by Kin-Yee.
These are faithful encodes of existing authored LetterMilo animation frames; no generated or substitute motion is used.

- `milo-idle.webp`: the bundled `MiloIdle00…29` sequence at 30 fps, followed by a 4-second hold of frame 00. Infinite 5-second loop, matching the app's cadence.
- `milo-talking.webp`: bundled `MiloTalk00…29`, 30 fps, infinite 1-second loop.
- `milo-listening.webp`: bundled `MiloListen00…29`, 30 fps, infinite 1-second loop.
- `milo-success.webp`: the app's Robot groove native SceneKit capture, frames 000…096 at 30 fps. One shot, approximately 3.233 seconds, ending on the app's held successful gesture. Animated WebP retains its last frame after completion.
- `milo-idle-still.webp`: bundled idle frame 00 for reduced motion and inactive playback.
- `milo-success-still.webp`: native robot frame 096 for reduced motion / success. Authored robot poses 096…107 are identical, so this is the same pose as the app's reduced-motion frame 99.

All assets are 384 × 384 with alpha transparency. Motion uses WebP quality 90 and static stills quality 92. Millisecond durations alternate 33, 33, 34 to retain 30-fps timing. No frames have been omitted.

The app currently uses its live SceneKit rig for all actions. The idle/listening/talking raster originals share its authored poses and camera but were rendered in Blender, with slightly softer shading. The success frames were exported directly by the app's native renderer. Source paths, dimensions, loop counts and sizes are recorded in `provenance.json`.

For the web player, reserve one fixed-size mascot box for every state. Use `prefers-reduced-motion` to select the stills; switch to a still while the demo is offscreen or the tab is hidden. Keep an idle still visible if motion fails to load, so the exercise remains usable. Verify the one-shot animation restarts on replay, since cached animated-image playback varies by browser.

Encoder: `encode.py` uses installed ImageMagick, img2webp and cwebp to resize and encode source PNGs. It only writes inside this temporary directory.
