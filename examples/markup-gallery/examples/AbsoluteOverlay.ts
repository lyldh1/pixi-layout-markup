import { MarkupLayoutContainer } from 'pixi-layout-markup';
import { applyTextStyles } from './exampleStyles';

export class AbsoluteOverlay extends MarkupLayoutContainer {
  public constructor() { super(); applyTextStyles(this); }
}
