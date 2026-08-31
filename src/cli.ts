#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import {
  compileMarkupFile,
  cleanMarkupRefTypes,
  generateMarkupRefTypes,
  writeMarkupRefTypes,
  type MarkupBuildOptions,
} from './core';
import { resolveMarkupConfig } from './config';

const [, , commandOrInput, ...args] = process.argv;
await main();

async function main(): Promise<void> {
  if (!commandOrInput) {
    printUsage();
    process.exitCode = 1;
  } else if (commandOrInput === 'generate-refs') {
    await generateRefs(args);
  } else {
    await compileFile(commandOrInput, readPositional(args), args);
  }
}

async function generateRefs(args: string[]): Promise<void> {
  const projectRoot = resolve(readOption(args, '--root') ?? '.');
  const loaded = await resolveMarkupConfig({
    configFile: readConfigOption(args),
  }, { cwd: projectRoot });
  const rootDir = resolve(loaded.config.rootDir ?? projectRoot);
  const source = readOption(args, '--source')
    ?? readPositional(args)
    ?? loaded.config.sourceDir
    ?? 'src';
  const sourceDir = resolve(rootDir, source);
  const options: MarkupBuildOptions = {
    ...loaded.config,
    rootDir,
    refTypesDir: readOption(args, '--out')
      ?? loaded.config.refTypesDir
      ?? '.pixi-layout-markup/types',
    componentDirs: splitOption(readOption(args, '--components'))
      ?? loaded.config.componentDirs
      ?? [source],
  };
  if (!existsSync(sourceDir)) {
    throw new Error(`Markup source directory does not exist: ${sourceDir}`);
  }
  if (args.includes('--clean') || options.cleanRefTypes) cleanMarkupRefTypes(options);
  const declarations = generateMarkupRefTypes(sourceDir, options);
  console.log(`Generated ${declarations.length} ref declaration(s) from ${sourceDir}.`);
}

async function compileFile(input: string, output: string | undefined, args: string[]): Promise<void> {
  const loaded = await resolveMarkupConfig({
    configFile: readConfigOption(args),
  });
  const inputPath = resolve(input);
  const outputPath = resolve(output ?? input.replace(/\.xml$/i, '.markup.js'));
  const compiled = compileMarkupFile(readFileSync(inputPath, 'utf8'), inputPath, {
    ...loaded.config,
    rootDir: loaded.config.rootDir ?? process.cwd(),
    refTypesDir: loaded.config.refTypesDir ?? '.pixi-layout-markup/types',
  });
  mkdirSync(dirname(outputPath), { recursive: true });
  const mapPath = `${outputPath}.map`;
  compiled.map.file = basename(outputPath);
  writeFileSync(
    outputPath,
    `${compiled.code}\n//# sourceMappingURL=${basename(mapPath)}`,
    'utf8',
  );
  writeFileSync(mapPath, JSON.stringify(compiled.map), 'utf8');
  writeMarkupRefTypes(compiled);
  console.log(outputPath);
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function splitOption(value?: string): string[] | undefined {
  return value?.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function readConfigOption(args: string[]): string | false | undefined {
  if (args.includes('--no-config')) return false;
  return readOption(args, '--config');
}

function readPositional(args: string[]): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index]?.startsWith('--')) {
      if (args[index] !== '--clean' && args[index] !== '--no-config') index += 1;
    } else {
      return args[index];
    }
  }
  return undefined;
}

function printUsage(): void {
  console.error([
    'Usage:',
    '  pixi-layout-markup <view.xml> [output.js] [--config <file>] [--no-config]',
    '  pixi-layout-markup generate-refs [source-dir]',
    '    [--root <dir>] [--source <dir>] [--out <dir>]',
    '    [--components <dir,...>] [--clean] [--config <file>] [--no-config]',
  ].join('\n'));
}
