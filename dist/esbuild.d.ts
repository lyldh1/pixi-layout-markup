import { type MarkupBuildOptions } from './core';
interface EsbuildResult {
    contents: string;
    loader: 'js' | 'ts';
}
interface EsbuildApi {
    initialOptions: {
        absWorkingDir?: string;
    };
    onLoad(options: {
        filter: RegExp;
    }, callback: (args: {
        path: string;
    }) => Promise<EsbuildResult | null>): void;
}
export interface PixiLayoutMarkupEsbuildPlugin {
    name: string;
    setup(build: EsbuildApi): void;
}
export declare function pixiLayoutMarkupEsbuild(options?: MarkupBuildOptions): PixiLayoutMarkupEsbuildPlugin;
export {};
