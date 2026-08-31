import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const browserPath = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean).find(existsSync);

test('markup gallery renders and switches every example without browser errors', {
  skip: browserPath ? false : 'Set PLAYWRIGHT_BROWSER_PATH or install Edge/Chrome to run browser tests.',
}, async (context) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'pixi-gallery-vite-'));
  const server = await createServer({
    configFile: resolve(process.cwd(), 'examples/markup-gallery/vite.config.ts'),
    cacheDir,
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  context.after(async () => {
    await browser.close();
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForSelector('.canvas-host canvas');
  const buttons = page.locator('.example-button');
  assert.equal(await buttons.count(), 9);
  for (let index = 0; index < 9; index += 1) {
    await buttons.nth(index).click();
    await page.waitForTimeout(30);
    assert.ok((await page.locator('.title h1').textContent())?.length);
    assert.match(await page.locator('pre code').textContent(), /<(?:LayoutContainer|Container)/);
  }
  await page.getByRole('button', { name: 'View.ts' }).click();
  assert.match(await page.locator('pre code').textContent(), /class FancyButtonDemo/);
  await page.getByRole('button', { name: 'Preview' }).click();
  assert.ok(await page.locator('.content').evaluate((element) => element.classList.contains('preview')));
  assert.deepEqual(errors, []);
});
