import { MarkupLayoutContainer } from 'pixi-layout-markup';
import { applyTextStyles } from './exampleStyles';

export class FlexRow extends MarkupLayoutContainer {
  public constructor() { super(); applyTextStyles(this); }
}
