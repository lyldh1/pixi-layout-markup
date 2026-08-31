import { LayoutContainer, type LayoutContainerOptions } from '@pixi/layout/components';
import type { MarkupTemplate } from './types';
export declare abstract class MarkupLayoutContainer<TRefs extends object = Record<string, any>> extends LayoutContainer {
    readonly refs: TRefs;
    protected constructor(options?: LayoutContainerOptions);
    protected constructor(template: MarkupTemplate, options?: LayoutContainerOptions);
    /** Applies generated markup after derived class fields have been initialized. */
    protected applyMarkup(template: MarkupTemplate): void;
}
