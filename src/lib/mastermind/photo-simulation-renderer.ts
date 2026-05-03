import sharp from 'sharp';
import type { SimulationFrame } from '@/types/mastermind';

export const MAX_PERSISTED_SOURCE_PHOTO_CHARS = 45_000;
const MAX_RENDER_SOURCE_PHOTO_CHARS = 240_000;

type RenderTrajectory = 'with' | 'without';

function parseImageDataUrl(value: string): { mime: string; buffer: Buffer } | null {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/=\r\n]+)$/i.exec(value.trim());
  if (!match) return null;
  const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  if (buffer.length === 0) return null;
  return { mime: match[1].toLowerCase(), buffer };
}

export function isCompactInlineSourcePhoto(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PERSISTED_SOURCE_PHOTO_CHARS) return false;
  return parseImageDataUrl(trimmed) !== null;
}

export function isRenderableSourcePhoto(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return true;
  }
  if (trimmed.length > MAX_RENDER_SOURCE_PHOTO_CHARS) return false;
  return parseImageDataUrl(trimmed) !== null;
}

function progressForFrame(trajectory: RenderTrajectory, frame: SimulationFrame): number {
  const month = Number.isFinite(frame.monthNumber) ? frame.monthNumber : 1;
  const denominator = trajectory === 'with' ? 12 : 60;
  return Math.max(0.12, Math.min(1, month / denominator));
}

export async function renderPhotoSimulationFrameImage(
  sourcePhotoUrl: string | null | undefined,
  trajectory: RenderTrajectory,
  frame: SimulationFrame,
): Promise<{ imageDataUrl: string; kind: SimulationFrame['kind'] } | null> {
  if (typeof sourcePhotoUrl !== 'string') return null;
  const parsed = parseImageDataUrl(sourcePhotoUrl);
  if (!parsed) return null;

  const progress = progressForFrame(trajectory, frame);
  try {
    let pipeline = sharp(parsed.buffer, { failOn: 'none' })
      .rotate()
      .resize({ width: 168, height: 224, fit: 'inside', withoutEnlargement: true });

    if (trajectory === 'with') {
      pipeline = pipeline
        .modulate({
          brightness: 1 + progress * 0.035,
          saturation: 1 + progress * 0.045,
        })
        .sharpen({ sigma: 0.35 + progress * 0.45, m1: 0.55, m2: 1.05 });
    } else {
      pipeline = pipeline
        .modulate({
          brightness: 1 - progress * 0.04,
          saturation: 1 - progress * 0.09,
        })
        .tint({
          r: Math.round(255 - progress * 6),
          g: Math.round(239 - progress * 10),
          b: Math.round(229 - progress * 15),
        });
      if (progress >= 0.2) {
        pipeline = pipeline.blur(0.22 + progress * 0.42);
      }
    }

    const output = await pipeline.jpeg({ quality: 30, mozjpeg: true }).toBuffer();
    return {
      imageDataUrl: `data:image/jpeg;base64,${output.toString('base64')}`,
      kind: 'photo-simulation',
    };
  } catch (error) {
    console.warn('[PhotoSimulation] Unable to render source photo frame:', error);
    return null;
  }
}
