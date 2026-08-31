import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  compileMarkupModule,
  compileMarkupRefsDeclaration,
  compileMarkupClassModule,
  type CompileMarkupOptions,
} from './compiler';
import { createXmlSourceMap, type RawSourceMap } from './sourceMap';

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

export function compileMarkupFile(
  source: string,
  fileName: string,
  options: MarkupBuildOptions = {},
): CompiledMarkupFile {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const declarationPath = options.generateRefTypes === false
    ? undefined
    : getRefTypesPath(fileName, { ...options, rootDir });
  const compileOptions: CompileMarkupOptions = {
    ...options,
    rootDir,
    fileName,
    declarationFileName: declarationPath,
  };
  const code = compileMarkupModule(source, compileOptions);
  return {
    code,
    map: createXmlSourceMap(source, code, fileName),
    declaration: declarationPath
      ? compileMarkupRefsDeclaration(source, basename(fileName, '.xml'), compileOptions)
      : undefined,
    declarationPath,
  };
}

export function compileMarkupClass(source: string, fileName?: string): string | null {
  return compileMarkupClassModule(source, fileName);
}

export function writeMarkupRefTypes(compiled: CompiledMarkupFile): void {
  if (!compiled.declaration || !compiled.declarationPath) return;
  const current = existsSync(compiled.declarationPath)
    ? readFileSync(compiled.declarationPath, 'utf8')
    : null;
  if (current === compiled.declaration) return;
  mkdirSync(dirname(compiled.declarationPath), { recursive: true });
  writeFileSync(compiled.declarationPath, compiled.declaration, 'utf8');
}

/** Recursively generates ref declarations for every XML file in a directory. */
export function generateMarkupRefTypes(
  sourceDir: string,
  options: MarkupBuildOptions = {},
): string[] {
  const declarations: string[] = [];
  visitMarkupDirectory(resolve(sourceDir), options, declarations);
  return declarations;
}

function visitMarkupDirectory(
  directory: string,
  options: MarkupBuildOptions,
  declarations: string[],
): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      visitMarkupDirectory(path, options, declarations);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.xml')) {
      const compiled = compileMarkupFile(readFileSync(path, 'utf8'), path, options);
      writeMarkupRefTypes(compiled);
      if (compiled.declarationPath) declarations.push(compiled.declarationPath);
    }
  }
}

export function getRefTypesPath(
  fileName: string,
  options: MarkupBuildOptions = {},
): string {
  if (!options.refTypesDir) {
    return join(dirname(fileName), `${basename(fileName, '.xml')}.refs.d.ts`);
  }
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const outputRoot = isAbsolute(options.refTypesDir)
    ? options.refTypesDir
    : resolve(rootDir, options.refTypesDir);
  const sourceRelative = relative(rootDir, fileName);
  const safeRelative = sourceRelative.startsWith('..')
    ? basename(fileName)
    : sourceRelative;
  return join(outputRoot, safeRelative.replace(/\.xml$/i, '.refs.d.ts'));
}

export function removeMarkupRefTypes(
  fileName: string,
  options: MarkupBuildOptions = {},
): void {
  const declarationPath = getRefTypesPath(fileName, options);
  if (existsSync(declarationPath)) unlinkSync(declarationPath);
}

export function cleanMarkupRefTypes(options: MarkupBuildOptions): void {
  if (!options.refTypesDir) return;
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const outputRoot = isAbsolute(options.refTypesDir)
    ? resolve(options.refTypesDir)
    : resolve(rootDir, options.refTypesDir);
  if (outputRoot === rootDir || !outputRoot.startsWith(`${rootDir}${sep}`)) {
    throw new Error(`refTypesDir must stay inside rootDir: ${outputRoot}`);
  }
  if (!existsSync(outputRoot)) return;
  removeDeclarations(outputRoot);
}

function removeDeclarations(directory: string): void {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) removeDeclarations(path);
    else if (entry.endsWith('.refs.d.ts')) unlinkSync(path);
  }
}
