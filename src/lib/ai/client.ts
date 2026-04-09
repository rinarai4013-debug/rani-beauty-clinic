import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';

let anthropicClient: Anthropic | null = null;

export function hasAnthropicClient(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

export function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  return anthropicClient;
}
