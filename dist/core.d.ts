import { type CompileMarkupOptions } from './compiler';
import { type RawSourceMap } from './sourceMap';
export interface MarkupBuildOptions extends CompileMarkupOptions {
    /** Project configuration file. Defaults to automatic discovery; false disables loading. */
    configFile?: string | false;
    /** Default directory scanned by the generate-refs CLI. */
    sourceDir?: string;
    refTypesDir?: string;
    cleanRefTypes?: boolean;
}
export interface CompiledMarkupFile {
    code: string;
    map: RawSourceMap;
    declaration?: string;
    declarationPath?: string;
}
export declare function compileMarkupFile(source: string, fileName: string, options?: MarkupBuildOptions): CompiledMarkupFile;
export declare function compileMarkupClass(source: string, fileName?: string): string | null;
export declare function writeMarkupRefTypes(compiled: CompiledMarkupFile): void;
/** Recursively generates ref declarations for every XML file in a directory. */
export declare function generateMarkupRefTypes(sourceDir: string, options?: MarkupBuildOptions): string[];
export declare function getRefTypesPath(fileName: string, options?: MarkupBuildOptions): string;
export declare function removeMarkupRefTypes(fileName: string, options?: MarkupBuildOptions): void;
export declare function cleanMarkupRefTypes(options: MarkupBuildOptions): void;
