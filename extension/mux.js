import { Input, BlobSource, ALL_FORMATS, Output, BufferTarget, Mp4OutputFormat, WebMOutputFormat,
  EncodedVideoPacketSource, EncodedAudioPacketSource, EncodedPacketSink } from './vendor/mediabunny.mjs';

export async function muxVideoAudio(videoBlob, audioBlob, extension, onProgress = () => {}) {
  const videoInput = new Input({ source: new BlobSource(videoBlob), formats: ALL_FORMATS });
  const audioInput = new Input({ source: new BlobSource(audioBlob), formats: ALL_FORMATS });
  let output;
  try {
    const video = await videoInput.getPrimaryVideoTrack();
    const audio = await audioInput.getPrimaryAudioTrack();
    if (!video || !audio) throw new Error('Görüntü veya ses kanalı bulunamadı.');
    const videoCodec = await video.getCodec(); const audioCodec = await audio.getCodec();
    const videoConfig = await video.getDecoderConfig(); const audioConfig = await audio.getDecoderConfig();
    if (!videoCodec || !audioCodec || !videoConfig || !audioConfig) throw new Error('Medya kodlaması desteklenmiyor.');
    const target = new BufferTarget();
    output = new Output({ target, format: extension === 'webm' ? new WebMOutputFormat() : new Mp4OutputFormat({ fastStart: 'in-memory' }) });
    const videoSource = new EncodedVideoPacketSource(videoCodec);
    const audioSource = new EncodedAudioPacketSource(audioCodec);
    output.addVideoTrack(videoSource); output.addAudioTrack(audioSource);
    await output.start();
    let packets = 0;
    async function copy(track, source, config) {
      let first = true;
      for await (const packet of new EncodedPacketSink(track).packets()) {
        await source.add(packet, first ? { decoderConfig: config } : undefined);
        first = false; packets++;
        if (packets % 250 === 0) { onProgress(packets); await new Promise(resolve => setTimeout(resolve, 0)); }
      }
      if (first) throw new Error('Medya kanalı boş.');
      source.close();
    }
    await Promise.all([copy(video, videoSource, videoConfig), copy(audio, audioSource, audioConfig)]);
    await output.finalize();
    if (!target.buffer?.byteLength) throw new Error('Birleştirilmiş dosya oluşturulamadı.');
    return new Blob([target.buffer], { type: extension === 'webm' ? 'video/webm' : 'video/mp4' });
  } catch (error) { if (output?.state !== 'finalized') await output?.cancel().catch(() => {}); throw error; }
  finally { videoInput.dispose(); audioInput.dispose(); }
}
