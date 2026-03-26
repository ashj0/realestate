import fs from 'node:fs/promises';
import path from 'node:path';

export async function saveDebugHtml(name: string, content: string): Promise<void> {
  if (process.env.SAVE_DEBUG_HTML !== 'true') return;
  const dir = path.resolve('debug');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${name}.html`), content, 'utf8');
}
