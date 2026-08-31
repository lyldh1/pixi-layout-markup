import { TextStyle } from 'pixi.js';

export const headingStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 28, fontWeight: '700', fill: '#f8fafc' });
export const bodyStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 16, fill: '#cbd5e1' });
export const labelStyle = new TextStyle({ fontFamily: 'Arial', fontSize: 14, fontWeight: '600', fill: '#ffffff' });

export function applyTextStyles(view: { refs: Record<string, any> }): void {
  if (view.refs.heading) view.refs.heading.style = headingStyle;
  if (view.refs.body) view.refs.body.style = bodyStyle;
  for (const [id, node] of Object.entries(view.refs)) {
    if (id.startsWith('label') && node && 'style' in node) node.style = labelStyle;
  }
}
