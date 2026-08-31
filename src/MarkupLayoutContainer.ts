import { LayoutContainer, type LayoutContainerOptions } from '@pixi/layout/components';
import type { ContainerChild } from 'pixi.js';
import type { MarkupTemplate } from './types';

export abstract class MarkupLayoutContainer<
  TRefs extends object = Record<string, any>,
> extends LayoutContainer {
  public readonly refs: TRefs;

  protected constructor(options?: LayoutContainerOptions);
  protected constructor(template: MarkupTemplate, options?: LayoutContainerOptions);
  protected constructor(templateOrOptions?: MarkupTemplate | LayoutContainerOptions, options?: LayoutContainerOptions) {
    const template = typeof templateOrOptions === 'function' ? templateOrOptions : undefined;
    const containerOptions = template ? options : templateOrOptions as LayoutContainerOptions | undefined;
    super(containerOptions);
    this.refs = {} as TRefs;
    template?.(this, this.refs as Record<string, ContainerChild>);
  }

  /** Applies generated markup after derived class fields have been initialized. */
  protected applyMarkup(template: MarkupTemplate): void {
    template(this, this.refs as Record<string, ContainerChild>);
  }
}
