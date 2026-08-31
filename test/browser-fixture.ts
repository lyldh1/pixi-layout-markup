import '@pixi/layout';
import { Application, Graphics } from 'pixi.js';

declare global {
  interface Window {
    __layoutResult?: { x: number; y: number; width: number; height: number };
    __eventCounts?: Record<string, number>;
  }
}

const app = new Application();
await app.init({ width: 400, height: 300, preference: 'webgl', backgroundAlpha: 0 });
document.body.appendChild(app.canvas);

const square = new Graphics().rect(0, 0, 100, 100).fill(0xff0000);
square.layout = true;
square.eventMode = 'static';
const eventCounts = { pointerover: 0, pointerdown: 0, pointerup: 0, pointertap: 0, pointerout: 0, wheel: 0 };
for (const eventName of Object.keys(eventCounts)) {
  square.on(eventName, () => { eventCounts[eventName as keyof typeof eventCounts] += 1; });
}
app.stage.addChild(square);
app.stage.layout = { width: 400, height: 300, justifyContent: 'center', alignItems: 'center' };
app.renderer.layout.update(app.stage);
app.renderer.render(app.stage);
await new Promise<void>((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())));
app.renderer.render(app.stage);

window.__layoutResult = {
  x: square.localTransform.tx,
  y: square.localTransform.ty,
  width: square.width,
  height: square.height,
};
window.__eventCounts = eventCounts;
