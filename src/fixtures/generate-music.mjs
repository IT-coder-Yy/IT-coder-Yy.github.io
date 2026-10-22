// 原创合成纯音乐测试夹具。无采样、无第三方曲目；字幕只用于验证同步交互。
import { mkdirSync, writeFileSync } from 'node:fs';
const destination = new URL('../../public/music/', import.meta.url);
mkdirSync(destination, { recursive: true });
const sampleRate = 22050;
const duration = 32;
const notes = [60, 64, 67, 71, 57, 60, 64, 69, 53, 57, 60, 64, 55, 59, 62, 67];
for (const [name, shift] of [['daylight', 0], ['nightfall', -5]]) {
  const count = sampleRate * duration;
  const data = Buffer.alloc(44 + count * 2);
  data.write('RIFF'); data.writeUInt32LE(36 + count * 2, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sampleRate, 24); data.writeUInt32LE(sampleRate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate;
    let value = 0;
    for (let back = 0; back < 4; back++) {
      const beat = Math.floor(t / 0.5) - back;
      if (beat < 0) continue;
      const age = t - beat * 0.5;
      const frequency = 440 * 2 ** ((notes[beat % notes.length] + shift - 69) / 12);
      const envelope = Math.min(1, age / .025) * Math.exp(-age * 2.3);
      value += (Math.sin(2 * Math.PI * frequency * age) + .16 * Math.sin(4 * Math.PI * frequency * age)) * envelope * .19;
    }
    value *= Math.min(1, t / 1.5, (duration - t) / 2);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + i * 2);
  }
  writeFileSync(new URL(`demo-${name}.wav`, destination), data);
}
console.log('Generated two 32-second instrumental demos (22.05 kHz mono PCM).');
