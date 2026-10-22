import { musicTracks as tracks } from '../data/music';
import { activeLyric, formatTime, nextPlayable, parseLyrics, restoreMusic, type LyricLine } from '../lib/music';

const root = document.querySelector<HTMLElement>('[data-music-player]')!;
const audio = root.querySelector<HTMLAudioElement>('[data-music-audio]')!;
const panel = root.querySelector<HTMLElement>('#music-panel')!;
const launcher = root.querySelector<HTMLButtonElement>('[data-music-open]')!;
const seek = root.querySelector<HTMLInputElement>('[data-music-seek]')!;
const volume = root.querySelector<HTMLInputElement>('[data-music-volume]')!;
const lyricBox = root.querySelector<HTMLElement>('[data-music-lyrics]')!;
const lyricState = root.querySelector<HTMLElement>('[data-music-lyrics-state]')!;
const lyricRetry = root.querySelector<HTMLButtonElement>('[data-music-lyrics-retry]')!;
const storageKey = 'meridian.music.v1';
const copy = {
  zh: {
    heading: '随身听', close: '收起播放器', open: '打开音乐播放器', lyrics: '歌词', playlist: '歌单',
    order: '顺序循环', content: '播放器内容', synced: '同步歌词，点击跳转', seek: '播放进度', volume: '音量',
    previous: '上一首', next: '下一首', play: '播放音乐', pause: '暂停音乐', resume: '继续音乐', retry: '重试',
    demo: '演示音轨', playing: '正在播放', paused: '已暂停 · 点击继续', ready: '点击播放，让音乐陪你逛逛',
    loading: '正在加载音乐…', lyricLoading: '正在加载歌词…', lyricError: '歌词暂不可用',
    lyricEmpty: '这首歌暂未提供同步歌词', allFailed: '歌曲暂时都无法播放，请点击播放重试。',
    skipped: '暂时无法播放，已跳过：', blocked: '浏览器未允许播放，请再次点击播放。', jump: '跳到',
    demoLyrics: '纯音乐演示 · 下方为同步测试字幕', empty: '歌单还在准备中',
  },
  en: {
    heading: 'On the record', close: 'Close player', open: 'Open music player', lyrics: 'Lyrics', playlist: 'Playlist',
    order: 'Repeat playlist', content: 'Player content', synced: 'Synced lyrics; click to seek', seek: 'Playback position', volume: 'Volume',
    previous: 'Previous track', next: 'Next track', play: 'Play music', pause: 'Pause music', resume: 'Resume music', retry: 'Retry',
    demo: 'Demo audio', playing: 'Now playing', paused: 'Paused · click to resume', ready: 'Press play and stay a little longer',
    loading: 'Loading music…', lyricLoading: 'Loading lyrics…', lyricError: 'Lyrics unavailable',
    lyricEmpty: 'No synced lyrics for this track yet', allFailed: 'No tracks could be played. Press play to retry.',
    skipped: 'Unavailable; skipped: ', blocked: 'Playback was blocked. Please press play again.', jump: 'Seek to',
    demoLyrics: 'Instrumental demo · synced test captions below', empty: 'The playlist is on its way',
  },
};
let text = copy[document.documentElement.lang.startsWith('en') ? 'en' : 'zh'];
let raw: string | null = null;
try { raw = localStorage.getItem(storageKey); } catch { /* 隐私模式下仍可使用播放器。 */ }
const saved = restoreMusic(raw, tracks.map(track => track.id));
let index = saved.index;
let pendingTime: number | undefined = saved.time;
let wanted = false;
let loading = false;
let playVersion = 0;
let lines: LyricLine[] = [];
let lineIndex = -1;
let lyricStatus: 'idle' | 'loading' | 'ready' | 'error' | 'empty' = 'idle';
let lyricRequest: AbortController | undefined;
let followAfter = 0;
let lastSave = 0;
let notice: keyof typeof text | '' = '';
let skippedTitle = '';
const failed = new Set<number>();
const lyricCache = new Map<string, LyricLine[]>();
audio.volume = saved.volume;
volume.value = String(saved.volume);

function put(selector: string, value: string) { root.querySelector<HTMLElement>(selector)!.textContent = value; }
function save() {
  if (!tracks[index]) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify({ id: tracks[index].id, time: pendingTime ?? audio.currentTime, volume: audio.volume }));
  } catch { /* 存储不可用不影响本次播放。 */ }
}

function renderState() {
  const playing = !audio.paused && !audio.ended;
  root.dataset.playing = String(playing);
  root.querySelector<HTMLButtonElement>('[data-music-toggle]')!.setAttribute('aria-label', playing ? text.pause : text.play);
  put('[data-music-state]', !tracks.length ? text.empty : loading && wanted ? text.loading : playing ? text.playing : (pendingTime ?? audio.currentTime) > 0 ? text.paused : text.ready);
  put('[data-music-notice]', notice ? text[notice] + (notice === 'skipped' ? skippedTitle : '') : '');
  document.querySelectorAll<HTMLButtonElement>('[data-music-preview-toggle]').forEach(button => {
    button.textContent = playing ? text.pause : text.resume;
    button.disabled = !tracks.length;
    button.setAttribute('aria-label', playing ? text.pause : text.resume);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-music-track]').forEach(button => {
    const current = Number(button.dataset.musicTrack) === index;
    button.setAttribute('aria-current', current ? 'true' : 'false');
    button.dataset.failed = String(failed.has(Number(button.dataset.musicTrack)));
  });
}

function renderLyricsState() {
  lyricState.hidden = lyricStatus === 'ready';
  lyricBox.hidden = lyricStatus !== 'ready';
  put('[data-music-lyrics-message]', lyricStatus === 'error' ? text.lyricError : lyricStatus === 'empty' ? text.lyricEmpty : text.lyricLoading);
  lyricRetry.hidden = lyricStatus !== 'error';
}

function syncLyrics(force = false) {
  const next = activeLyric(lines, pendingTime ?? audio.currentTime);
  const changed = next !== lineIndex;
  if (changed) {
    lyricBox.children[lineIndex]?.querySelector('button')?.removeAttribute('aria-current');
    lyricBox.children[next]?.querySelector('button')?.setAttribute('aria-current', 'true');
    lineIndex = next;
  }
  if ((changed || force) && next >= 0 && !panel.hidden && !lyricBox.hidden && Date.now() >= followAfter) {
    const row = lyricBox.children[next] as HTMLElement;
    lyricBox.scrollTo({ top: Math.max(0, row.offsetTop - lyricBox.clientHeight / 2 + row.clientHeight / 2), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
}

function renderLyrics() {
  lineIndex = -1;
  lyricBox.replaceChildren(...lines.map(line => {
    const row = document.createElement('div');
    row.setAttribute('role', 'listitem');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = line.text;
    button.title = line.text;
    button.setAttribute('aria-label', `${text.jump} ${formatTime(line.time)}: ${line.text}`);
    button.addEventListener('click', () => { followAfter = 0; seekTo(line.time); });
    row.append(button);
    return row;
  }));
  renderLyricsState();
  syncLyrics(true);
}

async function loadLyrics(retry = false) {
  if (!tracks[index]) return;
  const track = tracks[index];
  lyricRequest?.abort();
  const request = new AbortController();
  lyricRequest = request;
  if (!retry && lyricCache.has(track.id)) {
    lines = lyricCache.get(track.id)!;
    lyricStatus = 'ready'; renderLyrics(); return;
  }
  lyricStatus = track.lyrics ? 'loading' : 'empty';
  renderLyricsState();
  if (!track.lyrics) return;
  const timeout = window.setTimeout(() => request.abort(), 15000);
  try {
    const response = await fetch(track.lyrics, { signal: request.signal });
    if (!response.ok) throw new Error('Lyrics unavailable');
    const parsed = parseLyrics(await response.text());
    if (!parsed.length) throw new Error('No timed lyrics');
    if (lyricRequest !== request) return;
    lyricCache.set(track.id, parsed);
    lines = parsed; lyricStatus = 'ready'; renderLyrics();
  } catch {
    if (lyricRequest !== request) return;
    lyricStatus = 'error'; renderLyricsState();
  } finally { clearTimeout(timeout); }
}

function setOpen(open: boolean, restoreFocus = true) {
  panel.hidden = !open;
  root.dataset.open = String(open);
  launcher.setAttribute('aria-expanded', String(open));
  launcher.setAttribute('aria-label', open ? text.close : text.open);
  closePopovers();
  if (open) {
    if (lyricStatus === 'idle') void loadLyrics();
    syncLyrics(true);
    root.querySelector<HTMLButtonElement>('[data-music-toggle]')!.focus({ preventScroll: true });
  } else if (restoreFocus) launcher.focus({ preventScroll: true });
}

function updateTime() {
  const time = pendingTime ?? audio.currentTime;
  seek.max = String(Number.isFinite(audio.duration) ? audio.duration : 0);
  seek.disabled = !Number.isFinite(audio.duration);
  seek.value = String(time);
  seek.setAttribute('aria-valuetext', formatTime(time));
  put('[data-music-elapsed]', formatTime(time));
  put('[data-music-duration]', formatTime(audio.duration));
  syncLyrics();
}

function seekTo(time: number) {
  if (audio.readyState >= 1 && Number.isFinite(audio.duration)) {
    audio.currentTime = Math.min(time, Math.max(0, audio.duration - 0.01));
    pendingTime = undefined;
  } else pendingTime = time;
  updateTime(); save();
}

function renderTrack() {
  const track = tracks[index];
  if (!track) { renderState(); return; }
  put('[data-music-title]', track.title);
  put('[data-music-artist]', track.artist);
  root.querySelector<HTMLElement>('[data-music-title]')!.title = track.title;
  root.querySelector<HTMLElement>('[data-music-artist]')!.title = track.artist;
  root.querySelectorAll<HTMLImageElement>('[data-music-cover]').forEach(image => { image.hidden = false; image.src = track.cover; });
  root.querySelector<HTMLElement>('[data-music-demo]')!.hidden = !track.demo;
  lyricRequest?.abort(); lyricRequest = undefined;
  lines = []; lineIndex = -1; lyricStatus = 'idle'; lyricBox.replaceChildren();
  renderLyricsState(); updateTime(); renderState();
  if (!panel.hidden) void loadLyrics();
}

function failTrack() {
  if (failed.has(index)) return;
  failed.add(index);
  skippedTitle = tracks[index].title;
  const next = nextPlayable(index, tracks.length, failed);
  if (next < 0) {
    wanted = false; loading = false; audio.pause(); notice = 'allFailed'; renderState(); save();
  } else {
    notice = 'skipped'; selectTrack(next, true, false);
  }
}

function play(manual = true) {
  if (!tracks.length) return;
  if (manual) { failed.clear(); notice = ''; }
  wanted = true; loading = true;
  const version = ++playVersion;
  if (!audio.getAttribute('src') || audio.error) audio.src = tracks[index].audio;
  renderState();
  void audio.play().then(() => {
    if (version !== playVersion) return;
    loading = false; renderState();
  }).catch((error: DOMException) => {
    if (version !== playVersion) return;
    if (error.name === 'NotAllowedError') {
      wanted = false; loading = false; notice = 'blocked'; renderState();
    } else if (error.name !== 'AbortError') failTrack();
  });
}

function toggle() {
  if (!audio.paused || wanted) {
    ++playVersion; wanted = false; loading = false; audio.pause(); renderState(); save();
  } else play();
}

function selectTrack(next: number, autoplay: boolean, manual = true) {
  if (next < 0 || !tracks[next]) return;
  ++playVersion; wanted = false; audio.pause();
  audio.removeAttribute('src'); audio.load();
  index = next; pendingTime = 0; loading = false;
  if (manual) { failed.clear(); notice = ''; }
  renderTrack(); save();
  if (autoplay) play(false);
}

function closePopovers() {
  root.querySelectorAll<HTMLButtonElement>('[data-music-popover-toggle]').forEach(button => {
    button.setAttribute('aria-expanded', 'false');
    document.getElementById(button.getAttribute('aria-controls')!)!.hidden = true;
  });
}

function pageChanged() {
  text = copy[document.documentElement.lang.startsWith('en') ? 'en' : 'zh'];
  root.querySelectorAll<HTMLElement>('[data-music-i18n]').forEach(el => { el.textContent = text[el.dataset.musicI18n as keyof typeof text]; });
  root.querySelectorAll<HTMLElement>('[data-music-label]').forEach(el => { el.setAttribute('aria-label', text[el.dataset.musicLabel as keyof typeof text]); });
  launcher.setAttribute('aria-label', panel.hidden ? text.open : text.close);
  renderState(); renderLyricsState();
  if (lines.length) renderLyrics();
}

root.querySelector<HTMLElement>('[data-music-list]')!.replaceChildren(...tracks.map((track, position) => {
  const li = document.createElement('li');
  const button = document.createElement('button'); button.type = 'button'; button.dataset.musicTrack = String(position);
  const number = document.createElement('span'); number.className = 'music-list-number'; number.textContent = String(position + 1).padStart(2, '0');
  const details = document.createElement('span');
  const title = document.createElement('strong'); title.textContent = track.title;
  const artist = document.createElement('small'); artist.textContent = track.artist;
  details.append(title, artist); button.append(number, details); li.append(button);
  button.addEventListener('click', () => { selectTrack(position, true); closePopovers(); root.querySelector<HTMLButtonElement>('[aria-controls="music-list-popover"]')!.focus(); });
  return li;
}));

launcher.addEventListener('click', () => setOpen(panel.hidden));
root.querySelector('[data-music-close]')!.addEventListener('click', () => setOpen(false));
root.querySelector('[data-music-toggle]')!.addEventListener('click', toggle);
root.querySelector('[data-music-prev]')!.addEventListener('click', () => selectTrack(nextPlayable(index, tracks.length, new Set(), -1), wanted || !audio.paused));
root.querySelector('[data-music-next]')!.addEventListener('click', () => selectTrack(nextPlayable(index, tracks.length, new Set()), wanted || !audio.paused));
lyricRetry.addEventListener('click', () => void loadLyrics(true));
seek.addEventListener('input', () => seekTo(Number(seek.value)));
volume.addEventListener('input', () => { audio.volume = Number(volume.value); volume.setAttribute('aria-valuetext', `${Math.round(audio.volume * 100)}%`); save(); });
lyricBox.addEventListener('wheel', () => { followAfter = Date.now() + 4000; }, { passive: true });
lyricBox.addEventListener('touchstart', () => { followAfter = Date.now() + 4000; }, { passive: true });
root.querySelectorAll<HTMLButtonElement>('[data-music-popover-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const popover = document.getElementById(button.getAttribute('aria-controls')!)!;
    const open = popover.hidden;
    closePopovers();
    popover.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) {
      const control = popover.querySelector<HTMLElement>('input, button[aria-current="true"]') ?? popover.querySelector<HTMLElement>('button');
      control?.focus({ preventScroll: true });
      if (control?.matches('[data-music-track]')) control.scrollIntoView({ block: 'nearest' });
    }
  });
});
root.querySelectorAll<HTMLImageElement>('[data-music-cover]').forEach(image => image.addEventListener('error', () => { image.hidden = true; }));
audio.addEventListener('loadedmetadata', () => {
  if (pendingTime !== undefined) {
    audio.currentTime = pendingTime < audio.duration ? pendingTime : 0;
    pendingTime = undefined;
  }
  updateTime();
});
audio.addEventListener('timeupdate', () => { updateTime(); if (Date.now() - lastSave > 1000) { save(); lastSave = Date.now(); } });
audio.addEventListener('play', renderState);
audio.addEventListener('playing', () => { loading = false; renderState(); });
audio.addEventListener('pause', () => { renderState(); save(); });
audio.addEventListener('waiting', () => { loading = true; renderState(); });
audio.addEventListener('error', () => { if (wanted && audio.error) failTrack(); });
audio.addEventListener('ended', () => selectTrack(nextPlayable(index, tracks.length, failed), true, false));
document.addEventListener('click', event => {
  if ((event.target as Element).closest('[data-music-preview-toggle]')) toggle();
});
document.addEventListener('pointerdown', event => {
  if (!panel.hidden && !root.contains(event.target as Node)) setOpen(false, false);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || panel.hidden) return;
  event.preventDefault();
  const expanded = root.querySelector<HTMLButtonElement>('[data-music-popover-toggle][aria-expanded="true"]');
  if (expanded) { closePopovers(); expanded.focus(); }
  else setOpen(false);
});
document.addEventListener('portfolio:preview-open', () => { setOpen(false, false); renderState(); });
document.addEventListener('astro:before-swap', () => { setOpen(false, false); save(); });
document.addEventListener('astro:page-load', pageChanged);
window.addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
root.hidden = false;
if (!tracks.length) root.querySelectorAll<HTMLButtonElement | HTMLInputElement>('[data-music-toggle],[data-music-prev],[data-music-next],[data-music-seek],[data-music-volume]').forEach(el => { el.disabled = true; });
renderTrack(); pageChanged();
