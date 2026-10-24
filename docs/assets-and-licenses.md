# Assets and licenses

Verified 2026-10-23 against original sources and downloaded license text. No commercial-game art or generated character portraits are used.

| Asset | Author / source | License | Modifications / use |
| --- | --- | --- | --- |
| Roguelike Characters 2.0 | Kenney, https://kenney.nl/assets/roguelike-characters | CC0 1.0 | Unmodified transparent sprite sheet; runtime 16×16 frame selection from first column, rows 5–10, 1px spacing, nearest-neighbor scale. Characters at trading workstations; the phase-aware shop and bench also use CSS crops of these same rows alongside original role icons. |
| Workstations, role objects, tickets and links | Original project procedural graphics in floor-pixi.js | Project source, no third-party artwork | Drawn from rectangles/lines; distinct monitor, shield, antenna, lever, stack and option silhouettes. Also the missing-art fallback. |
| Existing SVG icons and CSS scenes | Original project source | Project source, no external asset attribution | Retained for accessible cards and no-WebGL fallback. |
| PixiJS 8.22.0 | PixiJS team, https://github.com/pixijs/pixijs | MIT | Bundled for browser rendering; copyright/license retained in assets/vendor/PixiJS-LICENSE and bundle legal notices. |

Kenney download: https://kenney.nl/media/pages/assets/roguelike-characters/53ffff4133-1729196490/kenney_roguelike-characters.zip . Original archive and supplied `License.txt` are under `assets/kenney/`. The [original source page](https://kenney.nl/assets/roguelike-characters) explicitly lists Creative Commons CC0; the included license confirms commercial reuse. Credit is voluntary; we provide it here. Pack previews/alternative sheet remain source material, not active game assets. No sprite editor's license is being used as an artwork license.

The requested [Roguelike/RPG pack](https://kenney.nl/assets/roguelike-rpg-pack) was also inspected and lists CC0, but is not downloaded or used. Other suggested libraries were unnecessary for this cohesive first pass. LibreSprite-compatible source textures are plain PNG; the five gameplay animation states are implemented in code, not represented as nonexistent authored character frames. More bespoke walking/action sheets remain future art work.

resvg, FFmpeg and Playwright are development tools for replay generation/testing, not artwork sources or shipped binaries. Their installed packages retain their own licenses. No external audio samples are used; existing sound is synthesized with Web Audio.

The build enumerates packages actually included by esbuild and aggregates their license files in `assets/vendor/THIRD-PARTY-LICENSES.txt`. The installed `@pixi/colord` package declares MIT but omits its license text; the original [Vlad Shilov license](https://raw.githubusercontent.com/omgovich/colord/master/LICENSE.md) is retained as `assets/vendor/colord-LICENSE.md` and included by the build. Bundled BSD/MIT notices are not replaced by the PixiJS license alone.
