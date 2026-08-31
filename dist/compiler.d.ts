import type { MarkupNode } from './types';
export type CompiledValueTransform = 'raw' | 'evaluate' | 'resolve' | 'action';
export interface CompiledValueSource {
    attribute: string;
    transform?: CompiledValueTransform;
    default?: string | number | boolean | null;
}
export interface CompiledComponentDefinition {
    module?: string;
    export?: string;
    arguments?: CompiledValueSource[];
    options?: Record<string, CompiledValueSource>;
}
export type MarkupValueType = 'string' | 'number' | 'number|string' | 'boolean' | 'color' | 'any';
export interface MarkupPropertyMetadata {
    type?: MarkupValueType;
    target?: 'constructor' | 'property' | 'layout';
}
export interface MarkupComponentMetadata {
    properties?: Record<string, MarkupValueType | MarkupPropertyMetadata>;
    events?: readonly string[];
    signals?: readonly string[];
    allowChildren?: boolean;
    strict?: boolean;
}
export interface MarkupNamespaceDefinition {
    directory?: string;
    module?: string;
    importMode?: 'subpath' | 'named';
}
export interface CompileMarkupOptions {
    components?: Record<string, CompiledComponentDefinition>;
    componentDirs?: string[];
    namespaces?: Record<string, string | MarkupNamespaceDefinition>;
    componentMetadata?: Record<string, MarkupComponentMetadata>;
    generateRefTypes?: boolean;
    fileName?: string;
    rootDir?: string;
    declarationFileName?: string;
}
export declare function defineMarkupComponent<TProperties extends object>(metadata: Omit<MarkupComponentMetadata, 'properties'> & {
    properties?: Partial<Record<keyof TProperties & string, MarkupValueType | MarkupPropertyMetadata>>;
}): MarkupComponentMetadata;
export declare class MarkupCompileError extends Error {
    readonly fileName?: string;
    readonly line: number;
    readonly column: number;
    readonly code: string;
    constructor(message: string, options?: {
        fileName?: string;
        line?: number;
        column?: number;
        code?: string;
    });
}
export declare function compileMarkup(source: string, options?: CompileMarkupOptions): MarkupNode;
export declare function compileMarkupModule(source: string, options?: CompileMarkupOptions): string;
export declare function compileMarkupClassModule(source: string, fileName?: string): string | null;
export declare function compileMarkupRefsDeclaration(source: string, viewName: string, options?: CompileMarkupOptions): string;
