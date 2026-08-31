import { MarkupLayoutContainer } from 'pixi-layout-markup';
import { applyTextStyles } from './exampleStyles';

export class InteractivePanel extends MarkupLayoutContainer {
  private count = 0;
  public constructor() { super(); applyTextStyles(this); }
  public increment(): void {
    this.count += 1;
    this.refs.labelCount.text = `Clicked ${this.count} times`;
    this.refs.button.rotation += 0.03;
  }
}
