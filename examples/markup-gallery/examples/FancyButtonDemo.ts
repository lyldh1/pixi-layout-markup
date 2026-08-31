import { MarkupLayoutContainer } from 'pixi-layout-markup';

export class FancyButtonDemo extends MarkupLayoutContainer {
  private count = 0;
  public constructor() { super(); }
  public press(): void {
    this.count += 1;
    this.refs.status.text = `onPress signal: ${this.count}`;
  }
}
