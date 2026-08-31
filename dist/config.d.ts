import type { MarkupBuildOptions } from './core';
export interface LoadMarkupConfigOptions {
    cwd?: string;
    configFile?: string | false;
}
export interface LoadedMarkupConfig {
    config: MarkupBuildOptions;
    path?: string;
}
export declare function defineMarkupConfig<T extends MarkupBuildOptions>(config: T): T;
export declare function findMarkupConfig(cwd?: string, configFile?: string | false): string | undefined;
export declare function loadMarkupConfig(options?: LoadMarkupConfigOptions): Promise<LoadedMarkupConfig>;
export declare function resolveMarkupConfig(overrides?: MarkupBuildOptions, options?: {
    cwd?: string;
}): Promise<LoadedMarkupConfig>;
export declare function mergeMarkupConfig(base: MarkupBuildOptions, overrides: MarkupBuildOptions): MarkupBuildOptions;
