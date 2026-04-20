// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { reactivationV1 } from '../reactivation-v1';

describe('reactivationV1', () => {
  it('renders campaign email and saves preview html', () => {
    const rendered = reactivationV1({
      first_name: 'angel',
      booking_url: 'https://www.ranibeautyclinic.com/book',
      unsubscribe_url: 'https://www.ranibeautyclinic.com/unsubscribe',
    });

    expect(rendered.subject).toBe("hi angel ✨ we've been thinking about you 💛");
    expect(rendered.preheader).toBe(
      'exciting news from inside the clinic, thought you should be the first to know 💛',
    );
    expect(rendered.html).toContain('book a visit');
    expect(rendered.html).toContain('401 Olympia Ave NE Ste 101, Renton WA 98056');
    expect(rendered.html).toContain('425-539-4440');

    const outputDir = join(process.cwd(), 'tmp');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, 'reactivation-preview.html'), rendered.html, 'utf8');
  });
});
