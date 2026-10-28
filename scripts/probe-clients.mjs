import { Constants } from '../extension/vendor/youtubei.js';
const videoId = process.argv[2];
if (!/^[\w-]{11}$/.test(videoId || '')) throw new Error('Video kimliği gerekli.');
for (const key of ['WEB_EMBEDDED', 'TV', 'TV_EMBEDDED']) {
  const client = Constants.CLIENTS[key];
  try {
    const response = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ videoId, context: { client: { clientName: client.NAME, clientVersion: client.VERSION, hl: 'tr', gl: 'TR' }, thirdParty: { embedUrl: 'https://www.youtube.com/' } } })
    });
    const data = await response.json();
    const formats = data.streamingData?.adaptiveFormats || [];
    console.log(key, response.status, data.playabilityStatus?.status, 'biçimler:', formats.length, 'bağlantılı:', formats.filter(f => f.url || f.signatureCipher || f.cipher).length);
  } catch (error) { console.log(key, error.message); }
}
