import { MarkupContainer } from 'pixi-layout-markup';
import { TextStyle } from 'pixi.js';

export class PlainContainer extends MarkupContainer {
  public constructor() {
    super();
    this.refs.title.style = new TextStyle({ fontFamily: 'Arial', fontSize: 28, fontWeight: '700', fill: '#f8fafc' });
  }
}
