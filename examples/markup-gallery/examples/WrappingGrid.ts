import { MarkupLayoutContainer } from 'pixi-layout-markup';
import { applyTextStyles } from './exampleStyles';

export class WrappingGrid extends MarkupLayoutContainer {
  public constructor() { super(); applyTextStyles(this); }
}
