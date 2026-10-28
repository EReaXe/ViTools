import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
let entries = [];
const context = { URL, document: { addEventListener() {} }, performance: { getEntriesByType: () => entries },
  location: { href: 'https://www.youtube.com/watch?v=abcdefghijk', origin: 'https://www.youtube.com' },
  window: { fetch() {} }, XMLHttpRequest: function () {} };
context.XMLHttpRequest.prototype.open = function () {};
vm.createContext(context);
vm.runInContext(readFileSync(new URL('../extension/caption-observer.js', import.meta.url), 'utf8'), context);
const original = 'https://a.googlevideo.com/videoplayback?id=video-a&itag=18&n=raw';
const resolve = context.__openVideoResolveMediaUrl;
entries = [{ name: 'https://a.googlevideo.com/videoplayback?id=video-b&itag=18&n=wrong' }];
assert.equal(resolve(original, 18), original);
entries.push({ name: 'https://a.googlevideo.com/videoplayback?id=video-a&itag=18&n=ready&range=0-100' });
const resolved = new URL(resolve(original, 18));
assert.equal(resolved.searchParams.get('n'), 'ready');
assert.equal(resolved.searchParams.has('range'), false);
entries = [{ name: `${original}&range=0-100&sparams=id,itag,range` }];
assert.equal(resolve(original, 18), original);
entries = [{ name: `${original}&n=failed`, responseStatus: 403 }];
assert.equal(resolve(original, 18), original);
console.log('Video URL: video/kalite eşleşmesi, parça aralığı ve reddedilen yanıt kontrolleri geçti.');
