# Vendored open source dependencies

- youtubei.js 18.3.0: https://github.com/LuanRT/YouTube.js — MIT. npm browser bundle, unchanged.
- sval 0.6.12: https://github.com/Siubaak/sval — MIT. dist/sval.js, unchanged; includes Acorn (MIT).
- mediabunny 1.62.1: https://github.com/Vanilagy/mediabunny — MPL-2.0. dist/bundles/mediabunny.mjs, unchanged. Corresponding source is included in the npm source archive: https://registry.npmjs.org/mediabunny/-/mediabunny-1.62.1.tgz (src/).
- googlevideo 5.0.1: https://github.com/LuanRT/googlevideo — MIT. SABR stream modules bundled locally with esbuild 0.28.2. Includes @bufbuild/protobuf 2.16.0 wire helpers (Apache-2.0 AND BSD-3-Clause). Rebuild entry: scripts/vendor-googlevideo-entry.mjs; npm run build:stream.
- lamejs 1.2.1: https://github.com/zhuker/lamejs — LAME JavaScript port (LGPL; bundled license FAQ and LAME LGPL text). Unminified lame.all.js with only `export default lamejs;` appended for ES modules. Corresponding source archive: https://registry.npmjs.org/lamejs/-/lamejs-1.2.1.tgz. LAME: https://lame.sourceforge.io/.

License texts are included alongside these files. All dependencies ship locally; no CDN scripts are loaded. YouTube player code is analyzed and interpreted to transform media URLs. MP4 AVC/AAC and WebM VP9-or-AV1/Opus adaptive tracks are remuxed locally without re-encoding. SABR downloads use the current video's player configuration and, when available, the player's existing stream verification token, held only in tab memory. PO-token generation and DRM are not implemented.
