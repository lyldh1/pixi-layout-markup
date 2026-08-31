import { MarkupLayoutContainer } from 'pixi-layout-markup';
import { applyTextStyles } from './exampleStyles';

export class BindingView extends MarkupLayoutContainer {
  public get headline(): string { return 'Prototype getter binding'; }
  public get detailsVisible(): boolean { return true; }
  public constructor() { super(); applyTextStyles(this); }
}
