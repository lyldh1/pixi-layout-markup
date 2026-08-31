import '@pixi/layout';
import { Application, Container } from 'pixi.js';
import './style.css';
import { AbsoluteOverlay } from './examples/AbsoluteOverlay';
import absoluteTs from './examples/AbsoluteOverlay.ts?raw';
import absoluteXml from './examples/AbsoluteOverlay.xml?raw';
import { BindingView } from './examples/BindingView';
import bindingTs from './examples/BindingView.ts?raw';
import bindingXml from './examples/BindingView.xml?raw';
import { CenteredCard } from './examples/CenteredCard';
import centeredTs from './examples/CenteredCard.ts?raw';
import centeredXml from './examples/CenteredCard.xml?raw';
import { FancyButtonDemo } from './examples/FancyButtonDemo';
import fancyTs from './examples/FancyButtonDemo.ts?raw';
import fancyXml from './examples/FancyButtonDemo.xml?raw';
import { FlexRow } from './examples/FlexRow';
import flexTs from './examples/FlexRow.ts?raw';
import flexXml from './examples/FlexRow.xml?raw';
import { GraphicsShowcase } from './examples/GraphicsShowcase';
import graphicsTs from './examples/GraphicsShowcase.ts?raw';
import graphicsXml from './examples/GraphicsShowcase.xml?raw';
import { InteractivePanel } from './examples/InteractivePanel';
import eventsTs from './examples/InteractivePanel.ts?raw';
import eventsXml from './examples/InteractivePanel.xml?raw';
import { PlainContainer } from './examples/PlainContainer';
import plainTs from './examples/PlainContainer.ts?raw';
import plainXml from './examples/PlainContainer.xml?raw';
import { WrappingGrid } from './examples/WrappingGrid';
import wrappingTs from './examples/WrappingGrid.ts?raw';
import wrappingXml from './examples/WrappingGrid.xml?raw';

interface GalleryExample {
  id: string;
  group: string;
  title: string;
  description: string;
  create: () => Container;
  xml: string;
  ts: string;
}

const examples: GalleryExample[] = [
  { id: 'center', group: 'Layout basics', title: 'Centered card', description: 'Center a styled panel with intrinsic Text and Graphics leaves.', create: () => new CenteredCard(), xml: centeredXml, ts: centeredTs },
  { id: 'flex', group: 'Layout basics', title: 'Flexible columns', description: 'Use flexDirection, flex and gap to divide available space.', create: () => new FlexRow(), xml: flexXml, ts: flexTs },
  { id: 'wrap', group: 'Layout basics', title: 'Wrapping grid', description: 'Responsive flexWrap and alignContent without manual positioning.', create: () => new WrappingGrid(), xml: wrappingXml, ts: wrappingTs },
  { id: 'absolute', group: 'Game UI', title: 'Absolute HUD', description: 'Combine normal flow with absolute top/right/bottom overlays.', create: () => new AbsoluteOverlay(), xml: absoluteXml, ts: absoluteTs },
  { id: 'events', group: 'Game UI', title: 'Pointer events', description: 'Compile eventMode, cursor and onPointertap into native PixiJS calls.', create: () => new InteractivePanel(), xml: eventsXml, ts: eventsTs },
  { id: 'binding', group: 'Compiler', title: 'Direct bindings', description: 'Bindings become direct property access with no runtime XML parser.', create: () => new BindingView(), xml: bindingXml, ts: bindingTs },
  { id: 'graphics', group: 'Graphics', title: 'Graphics commands', description: 'Circle, RoundRect, Star, Fill and Stroke compiled into native chains.', create: () => new GraphicsShowcase(), xml: graphicsXml, ts: graphicsTs },
  { id: 'container', group: 'Graphics', title: 'Plain Container', description: 'MarkupContainer works without creating a Yoga layout tree.', create: () => new PlainContainer(), xml: plainXml, ts: plainTs },
  { id: 'fancy', group: '@pixi/ui', title: 'FancyButton states', description: 'Declarative default, hover and pressed Graphics views plus signals.', create: () => new FancyButtonDemo(), xml: fancyXml, ts: fancyTs },
];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app mount.');
root.innerHTML = `
  <main class="shell">
    <aside class="sidebar">
      <div class="brand"><strong>pixi-layout-markup</strong><span>Interactive examples</span></div>
      <input class="search" type="search" placeholder="Search examples…" aria-label="Search examples" />
      <nav class="example-list"></nav>
    </aside>
    <section class="workspace">
      <header class="topbar">
        <div class="title"><h1></h1><p></p></div>
        <div class="modes" aria-label="View mode">
          <button class="mode" data-mode="editor">Editor</button>
          <button class="mode" data-mode="preview">Preview</button>
          <button class="mode active" data-mode="both">Both</button>
        </div>
      </header>
      <div class="content">
        <section class="pane preview-pane"><div class="canvas-host"></div></section>
        <section class="pane editor-pane">
          <div class="tabs"><button class="tab active" data-file="xml">View.xml</button><button class="tab" data-file="ts">View.ts</button></div>
          <pre><code></code></pre>
        </section>
      </div>
    </section>
  </main>`;

const list = root.querySelector<HTMLElement>('.example-list')!;
const search = root.querySelector<HTMLInputElement>('.search')!;
const title = root.querySelector<HTMLElement>('.title h1')!;
const description = root.querySelector<HTMLElement>('.title p')!;
const content = root.querySelector<HTMLElement>('.content')!;
const code = root.querySelector<HTMLElement>('pre code')!;
const canvasHost = root.querySelector<HTMLElement>('.canvas-host')!;

const app = new Application();
await app.init({
  width: Math.max(1, canvasHost.clientWidth),
  height: Math.max(1, canvasHost.clientHeight),
  background: '#0b1020',
  antialias: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
});
canvasHost.appendChild(app.canvas);

let selected = examples[0];
let activeView: Container | null = null;
let activeFile: 'xml' | 'ts' = 'xml';

function escapeCode(source: string): string {
  return source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderList(filter = ''): void {
  const filtered = examples.filter((example) => `${example.group} ${example.title}`.toLowerCase().includes(filter.toLowerCase()));
  list.replaceChildren();
  for (const group of [...new Set(filtered.map((example) => example.group))]) {
    const heading = document.createElement('div');
    heading.className = 'group-title';
    heading.textContent = group;
    list.appendChild(heading);
    for (const example of filtered.filter((item) => item.group === group)) {
      const button = document.createElement('button');
      button.className = `example-button${example.id === selected.id ? ' active' : ''}`;
      button.innerHTML = '<span class="dot"></span><span></span>';
      button.lastElementChild!.textContent = example.title;
      button.addEventListener('click', () => selectExample(example));
      list.appendChild(button);
    }
  }
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No matching examples.';
    list.appendChild(empty);
  }
}

function updateCode(): void {
  code.innerHTML = escapeCode(activeFile === 'xml' ? selected.xml : selected.ts);
}

function resizePreview(): void {
  app.renderer.resize(Math.max(1, canvasHost.clientWidth), Math.max(1, canvasHost.clientHeight));
  app.stage.layout = { width: app.screen.width, height: app.screen.height };
  app.renderer.layout.update(app.stage);
}

function selectExample(example: GalleryExample): void {
  selected = example;
  if (activeView) {
    app.stage.removeChild(activeView);
    activeView.destroy({ children: true });
  }
  activeView = example.create();
  app.stage.addChild(activeView);
  title.textContent = example.title;
  description.textContent = example.description;
  updateCode();
  renderList(search.value);
  resizePreview();
}

search.addEventListener('input', () => renderList(search.value));
for (const button of root.querySelectorAll<HTMLButtonElement>('.mode')) {
  button.addEventListener('click', () => {
    root.querySelectorAll('.mode').forEach((item) => item.classList.toggle('active', item === button));
    content.className = `content ${button.dataset.mode === 'both' ? '' : button.dataset.mode}`.trim();
    requestAnimationFrame(resizePreview);
  });
}
for (const button of root.querySelectorAll<HTMLButtonElement>('.tab')) {
  button.addEventListener('click', () => {
    activeFile = button.dataset.file as 'xml' | 'ts';
    root.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === button));
    updateCode();
  });
}

new ResizeObserver(resizePreview).observe(canvasHost);
selectExample(selected);
