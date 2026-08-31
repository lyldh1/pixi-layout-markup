import { MarkupLayoutContainer } from 'pixi-layout-markup';
import { applyTextStyles } from './exampleStyles';

export class GraphicsShowcase extends MarkupLayoutContainer {
  public constructor() { super(); applyTextStyles(this); }
}
