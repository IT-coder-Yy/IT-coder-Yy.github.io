// 将用户本地 KRC 的逐句时间保留为标准 LRC；不处理音频。
// KRC 容器格式参考：https://github.com/veficos/krc2lrc/blob/master/python/krc2lrc.pyw
import { readFile, writeFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { resolve } from 'node:path';

const [source, destination] = process.argv.slice(2);
if (!source || !destination || resolve(source) === resolve(destination)) {
  throw new Error('用法：node src/fixtures/convert-krc.mjs 输入.krc 输出.lrc（不能覆盖输入文件）');
}
const bytes = await readFile(source);
if (bytes.subarray(0, 4).toString() !== 'krc1') throw new Error('不是受支持的 KRC 文件');
const key = [0x40, 0x47, 0x61, 0x77, 0x5e, 0x32, 0x74, 0x47, 0x51, 0x36, 0x31, 0x2d, 0xce, 0xd2, 0x6e, 0x69];
const decoded = inflateSync(bytes.subarray(4).map((byte, index) => byte ^ key[index % key.length])).toString('utf8').replace(/^\uFEFF/, '');
const result = [];
let count = 0;
let lastTime = -1;
for (const line of decoded.split(/\r?\n/)) {
  if (/^\[(?:ar|ti|al|offset):/.test(line)) { result.push(line); continue; }
  const match = line.match(/^\[(\d+),\d+\](.*)$/);
  if (!match) continue;
  const time = Number(match[1]);
  const text = match[2].replace(/<\d+,\d+,\d+>/g, '').trim();
  if (!text) continue;
  if (time < lastTime) throw new Error('歌词时间不递增，请检查原文件');
  lastTime = time;
  const minutes = String(Math.floor(time / 60000)).padStart(2, '0');
  const seconds = String(Math.floor(time / 1000) % 60).padStart(2, '0');
  const milliseconds = String(time % 1000).padStart(3, '0');
  result.push(`[${minutes}:${seconds}.${milliseconds}]${text}`);
  count++;
}
if (!count) throw new Error('文件中没有逐句歌词');
await writeFile(destination, result.join('\n') + '\n', { encoding: 'utf8', flag: 'wx' });
console.log(JSON.stringify({ destination, lines: count, lastTime: lastTime / 1000 }));
