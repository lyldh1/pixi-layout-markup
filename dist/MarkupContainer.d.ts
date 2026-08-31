import type { ContainerOptions } from 'pixi.js';
import { Container } from 'pixi.js';
import type { MarkupTemplate } from './types';
export declare abstract class MarkupContainer<TRefs extends object = Record<string, any>> extends Container {
    readonly refs: TRefs;
    protected constructor(options?: ContainerOptions);
    protected constructor(template: MarkupTemplate, options?: ContainerOptions);
    /** Applies generated markup after derived class fields have been initialized. */
    protected applyMarkup(template: MarkupTemplate): void;
}
