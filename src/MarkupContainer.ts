import type { ContainerChild, ContainerOptions } from 'pixi.js';
import { Container } from 'pixi.js';
import type { MarkupTemplate } from './types';

export abstract class MarkupContainer<
  TRefs extends object = Record<string, any>,
> extends Container {
  public readonly refs: TRefs;

  protected constructor(options?: ContainerOptions);
  protected constructor(template: MarkupTemplate, options?: ContainerOptions);
  protected constructor(templateOrOptions?: MarkupTemplate | ContainerOptions, options?: ContainerOptions) {
    const template = typeof templateOrOptions === 'function' ? templateOrOptions : undefined;
    const containerOptions = template ? options : templateOrOptions as ContainerOptions | undefined;
    super(containerOptions);
    this.refs = {} as TRefs;
    template?.(this, this.refs as Record<string, ContainerChild>);
  }

  /** Applies generated markup after derived class fields have been initialized. */
  protected applyMarkup(template: MarkupTemplate): void {
    template(this, this.refs as Record<string, ContainerChild>);
  }
}
