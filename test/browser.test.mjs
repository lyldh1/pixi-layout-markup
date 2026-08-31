import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const browserCandidates = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const browserPath = browserCandidates.find(existsSync);

test('real browser computes layout and dispatches pointer, mouse, and wheel input', {
  skip: browserPath ? false : 'Set PLAYWRIGHT_BROWSER_PATH or install Edge/Chrome to run browser tests.',
}, async (context) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'pixi-layout-markup-vite-'));
  const server = await createServer({
    root: resolve(process.cwd(), 'test'),
    cacheDir,
    configFile: false,
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  context.after(async () => {
    await browser.close();
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  });
  const page = await browser.newPage();
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.stack ?? error.message));
  page.on('console', (message) => browserErrors.push(`console.${message.type()}: ${message.text()}`));
  page.on('response', (response) => {
    if (!response.ok()) browserErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => browserErrors.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.goto(new URL('/browser-fixture.html', server.resolvedUrls.local[0]).href);
  try {
    await page.waitForFunction(() => window.__layoutResult, undefined, { timeout: 10_000 });
  } catch (error) {
    assert.fail(`${error.message}\nURL: ${page.url()}\n${await page.content()}\n${browserErrors.join('\n')}`);
  }
  const result = await page.evaluate(() => window.__layoutResult);
  assert.deepEqual(result, { x: 150, y: 100, width: 100, height: 100 });
  await page.mouse.move(200, 150);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.wheel(0, 20);
  await page.mouse.move(10, 10);
  await page.waitForFunction(() => window.__eventCounts.pointertap === 1 && window.__eventCounts.pointerout === 1);
  const events = await page.evaluate(() => window.__eventCounts);
  assert.deepEqual(events, {
    pointerover: 1,
    pointerdown: 1,
    pointerup: 1,
    pointertap: 1,
    pointerout: 1,
    wheel: 1,
  });
});
