import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeLyric, formatTime, nextPlayable, parseLyrics, restoreMusic } from './music.ts';

test('LRC 支持多时间戳、毫秒、偏移、CRLF 和无效时间过滤', () => {
  const lines = parseLyrics('[ti:demo]\r\n[offset:-250]\r\n[00:03.50][00:01.250]同一句\r\n[00:00.10]开头\r\n[00:99]无效\r\n无时间戳');
  assert.deepEqual(lines, [{ time: 0, text: '开头' }, { time: 1, text: '同一句' }, { time: 3.25, text: '同一句' }]);
  assert.equal(activeLyric(lines, .9), 0);
  assert.equal(activeLyric(lines, 3.25), 2);
  assert.equal(activeLyric([{ time: 4, text: '前奏之后' }], 1), -1);
  assert.deepEqual(parseLyrics('<html>404</html>'), []);
});
test('歌单循环会跳过故障曲目，全部失败时终止', () => {
  assert.equal(nextPlayable(2, 3, new Set()), 0);
  assert.equal(nextPlayable(0, 3, new Set(), -1), 2);
  assert.equal(nextPlayable(0, 3, new Set([1])), 2);
  assert.equal(nextPlayable(0, 2, new Set([0, 1])), -1);
  assert.equal(nextPlayable(0, 0, new Set()), -1);
});
test('状态以曲目 id 恢复，处理删歌、坏 JSON 和越界音量', () => {
  assert.deepEqual(restoreMusic('{', ['a']), { index: 0, time: 0, volume: .25 });
  assert.deepEqual(restoreMusic('{"id":"b","time":12,"volume":0}', ['b','a']), { index: 0, time: 12, volume: 0 });
  assert.deepEqual(restoreMusic('{"id":"removed","time":99,"volume":8}', ['a']), { index: 0, time: 0, volume: 1 });
  assert.deepEqual(restoreMusic('{"id":"a","time":-1,"volume":"loud"}', ['a']), { index: 0, time: 0, volume: .25 });
});
test('时间显示覆盖未加载时长与超过一小时的曲目', () => {
  assert.equal(formatTime(NaN), '0:00');
  assert.equal(formatTime(-1), '0:00');
  assert.equal(formatTime(3661), '61:01');
});
