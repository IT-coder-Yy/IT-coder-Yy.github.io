import type { Artwork } from './portfolio';

// 封面来自用户最终选定的风格预览；视频使用对应的最终交付版本。
export const projectMedia: Record<Artwork, { poster: string; video: string; width: number; height: number }> = {
  travel: { poster: '/project-media/travel.webp', video: '/project-media/travel.mp4', width: 1672, height: 941 },
  freight: { poster: '/project-media/freight.webp', video: '/project-media/freight.mp4', width: 1672, height: 941 },
  recruitment: { poster: '/project-media/recruitment.webp', video: '/project-media/recruitment.mp4', width: 1672, height: 941 },
  prompt: { poster: '/project-media/prompt.webp', video: '/project-media/prompt.mp4', width: 1672, height: 941 },
  minimax: { poster: '/project-media/minimax.webp', video: '/project-media/minimax.mp4', width: 1672, height: 941 },
  video: { poster: '/project-media/video.webp', video: '/project-media/video.mp4', width: 1672, height: 941 },
  git: { poster: '/project-media/git.webp', video: '/project-media/git.mp4', width: 1672, height: 941 },
  random: { poster: '/project-media/random.webp', video: '/project-media/random.mp4', width: 1672, height: 941 },
  camera: { poster: '/project-media/camera.webp', video: '/project-media/camera.mp4', width: 1672, height: 941 },
  safety: { poster: '/project-media/safety.webp', video: '/project-media/safety.mp4', width: 1672, height: 941 },
};
