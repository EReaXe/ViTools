import { Player, Platform, Log } from './vendor/youtubei.js';
import Sval from './vendor/sval.js';

// Interpretation keeps the extension free of eval/new Function and remote imports.
Log.setLevel(0);
Platform.shim.eval = data => {
  const interpreter = new Sval({ ecmaVer: 'latest', sandbox: true });
  interpreter.run(`exports.result = (function () {\n${data.output}\n})()`);
  return interpreter.exports.result;
};
const players = new Map();
export async function decipherVideo(request) {
  if (!/^[a-zA-Z0-9_-]+$/.test(request.playerId || '')) throw new Error('YouTube oynatıcı sürümü bulunamadı.');
  let pending = players.get(request.playerId);
  if (!pending) {
    pending = Player.create(undefined, fetch, undefined, request.playerId);
    players.set(request.playerId, pending);
    pending.catch(() => players.delete(request.playerId));
    if (players.size > 3) players.delete(players.keys().next().value);
  }
  const player = await pending;
  if (!player.data?.exported?.includes('nsigFunction')) throw new Error('Bu YouTube oynatıcı sürümünün bağlantısı çözümlenemedi.');
  const result = await player.decipher(request.url || undefined, request.signatureCipher || undefined, request.cipher || undefined);
  const url = new URL(result);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.googlevideo.com')) throw new Error('Çözümlenen kaynak geçersiz.');
  return url.href;
}
