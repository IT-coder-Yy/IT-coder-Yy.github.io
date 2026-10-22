export interface LyricLine { time: number; text: string }

export function parseLyrics(source: string): LyricLine[] {
  const offset = Number(source.match(/\[offset:([+-]?\d+)\]/i)?.[1] ?? 0) / 1000;
  const lines: LyricLine[] = [];
  for (const line of source.split(/\r?\n/)) {
    const stamps = [...line.matchAll(/\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    const text = line.replace(/\[[^\]]*\]/g, '').trim();
    if (!text) continue;
    for (const stamp of stamps) {
      if (Number(stamp[2]) >= 60) continue;
      const time = Number(stamp[1]) * 60 + Number(stamp[2]) + Number(`0.${stamp[3] ?? 0}`) + offset;
      lines.push({ time: Math.max(0, time), text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function activeLyric(lines: LyricLine[], time: number) {
  return lines.findLastIndex(line => line.time <= time);
}

export function nextPlayable(index: number, count: number, failed: Set<number>, direction = 1) {
  for (let step = 1; step <= count; step++) {
    const next = (index + step * direction + count) % count;
    if (!failed.has(next)) return next;
  }
  return -1;
}

export function restoreMusic(raw: string | null, ids: string[], defaultVolume = 0.25) {
  const fallback = { index: 0, time: 0, volume: defaultVolume };
  try {
    const saved = JSON.parse(raw ?? 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    const index = ids.indexOf(saved.id);
    return {
      index: Math.max(0, index),
      time: index >= 0 && Number.isFinite(saved.time) && saved.time >= 0 ? saved.time : 0,
      volume: Number.isFinite(saved.volume) ? Math.max(0, Math.min(1, saved.volume)) : defaultVolume,
    };
  } catch { return fallback; }
}

export function formatTime(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
