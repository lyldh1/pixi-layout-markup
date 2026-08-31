export interface RawSourceMap {
    version: number;
    file?: string;
    sources: string[];
    sourcesContent: string[];
    names: string[];
    mappings: string;
}
export declare function createXmlSourceMap(source: string, code: string, fileName: string): RawSourceMap;
