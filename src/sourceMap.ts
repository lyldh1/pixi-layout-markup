import { SourceMapGenerator } from 'source-map-js';

export interface RawSourceMap {
  version: number;
  file?: string;
  sources: string[];
  sourcesContent: string[];
  names: string[];
  mappings: string;
}

interface XmlLocation {
  name: string;
  line: number;
  column: number;
  attributes: Record<string, { line: number; column: number }>;
  children: XmlLocation[];
}

export function createXmlSourceMap(source: string, code: string, fileName: string): RawSourceMap {
  const sourceName = fileName.replace(/\\/g, '/');
  const roots = scanXmlTree(source);
  const locations = roots.flatMap(flattenSourceOrder);
  const emissionLocations = roots.flatMap((root) =>
    root.children.flatMap((child) => flattenEmissionOrder(child)));
  const queues = new Map<string, XmlLocation[]>();
  for (const location of emissionLocations) {
    const queue = queues.get(location.name) ?? [];
    queue.push(location);
    queues.set(location.name, queue);
  }

  const aliases = new Map<string, string>();
  for (const match of code.matchAll(/import \{\s*([\w$]+)\s+as\s+([\w$]+)\s*\}/g)) {
    aliases.set(match[2], match[1]);
  }

  const generator = new SourceMapGenerator({ file: `${sourceName}.js` });
  generator.setSourceContent(sourceName, source);
  const variables = new Map<string, XmlLocation>();
  const contexts = new Map<string, XmlLocation>();
  const root = locations[0];
  const lines = code.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    let location: XmlLocation | undefined;
    const contextDeclaration = line.match(/^const (__MarkupGraphicsContext\d+) = new __MarkupGraphicsContext/);
    if (contextDeclaration) {
      location = queues.get('Graphics')?.shift() ?? queues.get('LayoutGraphics')?.shift();
      if (location) contexts.set(contextDeclaration[1], location);
    }

    const declaration = line.match(/const (node\d+) = new ([\w$]+)\((.*)\);/);
    if (declaration) {
      const context = declaration[3].match(/context:\s*(__MarkupGraphicsContext\d+)/)?.[1];
      const tagName = aliases.get(declaration[2]);
      location = context ? contexts.get(context) : tagName ? queues.get(tagName)?.shift() : undefined;
      if (location) variables.set(declaration[1], location);
    }

    if (!location) {
      const variable = line.match(/\b(node\d+|__MarkupGraphicsContext\d+)\b/)?.[1];
      location = variable ? variables.get(variable) ?? contexts.get(variable) : undefined;
    }
    if (!location && /\btarget\b/.test(line) && !line.startsWith('export default')) location = root;
    if (!location) continue;

    const property = line.match(/\["([^"]+)"\]/)?.[1];
    const original = property
      ? location.attributes[property]
        ?? location.attributes[`prop.${property}`]
        ?? location.attributes[`set.${property}`]
        ?? location
      : location;
    generator.addMapping({
      generated: { line: index + 1, column: Math.max(0, line.search(/\S/)) },
      original: { line: original.line, column: original.column },
      source: sourceName,
    });
  }
  return generator.toJSON() as unknown as RawSourceMap;
}

function scanXmlTree(source: string): XmlLocation[] {
  const result: XmlLocation[] = [];
  const stack: XmlLocation[] = [];
  for (let index = 0; index < source.length;) {
    const start = source.indexOf('<', index);
    if (start < 0) break;
    const next = source[start + 1];
    if (next === '/') {
      stack.pop();
      index = source.indexOf('>', start + 2) + 1 || source.length;
      continue;
    }
    if (next === '?' || next === '!') {
      index = start + 2;
      continue;
    }
    const nameMatch = source.slice(start + 1).match(/^([A-Za-z_$][\w$:.-]*)/);
    if (!nameMatch) {
      index = start + 1;
      continue;
    }
    let end = start + 1 + nameMatch[0].length;
    let quote = '';
    while (end < source.length) {
      const character = source[end];
      if (quote) {
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") quote = character;
      else if (character === '>') break;
      end += 1;
    }
    const location = offsetToLocation(source, start + 1);
    const attributes: XmlLocation['attributes'] = {};
    const bodyStart = start + 1 + nameMatch[0].length;
    const body = source.slice(bodyStart, end);
    for (const match of body.matchAll(/([A-Za-z_$][\w$:.-]*)\s*=\s*["']/g)) {
      attributes[match[1]] = offsetToLocation(source, bodyStart + (match.index ?? 0));
    }
    const node = { name: nameMatch[1], ...location, attributes, children: [] };
    const parent = stack.at(-1);
    if (parent) parent.children.push(node);
    else result.push(node);
    if (!source.slice(start, end).trimEnd().endsWith('/')) stack.push(node);
    index = end + 1;
  }
  return result;
}

function flattenSourceOrder(node: XmlLocation): XmlLocation[] {
  return [node, ...node.children.flatMap(flattenSourceOrder)];
}

function flattenEmissionOrder(node: XmlLocation): XmlLocation[] {
  const propertyValues: XmlLocation[] = [];
  const regularChildren: XmlLocation[] = [];
  for (const child of node.children) {
    if (child.name.startsWith(`${node.name}.`)) {
      for (const value of child.children) propertyValues.push(...flattenValueEmission(value));
    } else if (!isDeclarativePseudoElement(node, child)) {
      regularChildren.push(child);
    }
  }
  return [
    ...propertyValues,
    ...(node.name === 'LayoutView' ? regularChildren.flatMap(flattenEmissionOrder) : [node]),
    ...(node.name === 'LayoutView' ? [node] : regularChildren.flatMap(flattenEmissionOrder)),
  ];
}

function flattenValueEmission(node: XmlLocation): XmlLocation[] {
  if (node.name === 'Value') return [];
  if (node.name === 'Array') return node.children.flatMap(flattenValueEmission);
  if (node.name === 'Object') {
    return node.children.flatMap((property) => property.children.flatMap(flattenValueEmission));
  }
  return flattenEmissionOrder(node);
}

function isDeclarativePseudoElement(parent: XmlLocation, child: XmlLocation): boolean {
  if (parent.name !== 'Graphics' && parent.name !== 'LayoutGraphics') return false;
  return !child.name.startsWith(`${parent.name}.`);
}

function offsetToLocation(source: string, offset: number): { line: number; column: number } {
  const before = source.slice(0, offset);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: lines.at(-1)?.length ?? 0 };
}
