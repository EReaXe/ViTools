globalThis.formatSubtitles = (data, format) => {
  const cues = (data.events || []).filter(event => Array.isArray(event.segs)).map(event => ({
    start: Number(event.tStartMs), duration: Number(event.dDurationMs),
    text: event.segs.map(seg => seg.utf8 || '').join('').trim()
  })).filter(cue => cue.text && Number.isFinite(cue.start) && cue.start >= 0 && cue.duration > 0);
  if (!cues.length) throw new Error('Bu dil için altyazı metni alınamadı.');
  function timestamp(ms) {
    ms = Math.round(ms);
    return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}${format === 'srt' ? ',' : '.'}${String(ms % 1000).padStart(3, '0')}`;
  }
  const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return (format === 'vtt' ? 'WEBVTT\n\n' : '') + cues.map((cue, index) =>
    `${index + 1}\n${timestamp(cue.start)} --> ${timestamp(cue.start + cue.duration)}\n${escape(cue.text)}\n`
  ).join('\n');
};
