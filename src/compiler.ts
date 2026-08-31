import { XMLParser, XMLValidator } from 'fast-xml-parser';
import * as ts from 'typescript';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
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

export function defineMarkupComponent<TProperties extends object>(
  metadata: Omit<MarkupComponentMetadata, 'properties'> & {
    properties?: Partial<Record<keyof TProperties & string, MarkupValueType | MarkupPropertyMetadata>>;
  },
): MarkupComponentMetadata {
  return metadata as MarkupComponentMetadata;
}

export class MarkupCompileError extends Error {
  public readonly fileName?: string;
  public readonly line: number;
  public readonly column: number;
  public readonly code: string;

  public constructor(message: string, options: {
    fileName?: string;
    line?: number;
    column?: number;
    code?: string;
  } = {}) {
    const location = options.fileName
      ? `${options.fileName}:${options.line ?? 1}:${options.column ?? 1}: `
      : '';
    super(`${location}${message}`);
    this.name = 'MarkupCompileError';
    this.fileName = options.fileName;
    this.line = options.line ?? 1;
    this.column = options.column ?? 1;
    this.code = options.code ?? 'MARKUP_ERROR';
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  preserveOrder: true,
  processEntities: true,
  trimValues: false,
});

const INLINE_NAMESPACES = new WeakMap<MarkupNode, Record<string, string>>();

const LAYOUT_ATTRIBUTES = new Set([
  'alignContent', 'alignItems', 'alignSelf', 'aspectRatio', 'borderBottomWidth',
  'borderEndWidth', 'borderLeftWidth', 'borderRightWidth', 'borderStartWidth',
  'borderTopWidth', 'borderWidth', 'borderInlineWidth', 'borderBlockWidth',
  'bottom', 'left', 'right', 'top', 'end', 'start', 'boxSizing', 'direction',
  'display', 'flex', 'flexBasis', 'flexDirection', 'rowGap', 'gap', 'columnGap',
  'flexGrow', 'flexShrink', 'flexWrap', 'justifyContent', 'margin',
  'marginBottom', 'marginEnd', 'marginLeft', 'marginRight', 'marginStart',
  'marginTop', 'marginInline', 'marginBlock', 'width', 'height', 'maxHeight',
  'maxWidth', 'minHeight', 'minWidth', 'overflow', 'padding', 'paddingBottom',
  'paddingEnd', 'paddingLeft', 'paddingRight', 'paddingStart', 'paddingTop',
  'paddingInline', 'paddingBlock', 'insetInline', 'insetBlock', 'inset',
  'position', 'borderRadius', 'backgroundColor', 'borderColor',
  'transformOrigin', 'objectFit', 'objectPosition', 'applySizeDirectly', 'isLeaf',
  'debug', 'debugHeat', 'debugDrawMargin', 'debugDrawPadding', 'debugDrawBorder',
  'debugDrawFlex', 'debugDrawContent',
]);

const LAYOUT_ATTRIBUTE_TYPES: Readonly<Record<string, MarkupValueType>> = {
  backgroundColor: 'color',
  borderColor: 'color',
  applySizeDirectly: 'boolean',
  isLeaf: 'boolean',
  debug: 'boolean',
  debugHeat: 'boolean',
  debugDrawMargin: 'boolean',
  debugDrawPadding: 'boolean',
  debugDrawBorder: 'boolean',
  debugDrawFlex: 'boolean',
  debugDrawContent: 'boolean',
};

const LAYOUT_LEAF_COMPONENTS = new Set([
  'LayoutSprite', 'LayoutNineSliceSprite', 'LayoutTilingSprite',
  'LayoutAnimatedSprite', 'LayoutGraphics', 'LayoutText', 'LayoutBitmapText',
  'LayoutHTMLText', 'LayoutMesh', 'LayoutPerspectiveMesh', 'LayoutMeshPlane',
  'LayoutMeshRope', 'LayoutMeshSimple', 'LayoutGifSprite', 'Sprite',
  'NineSliceSprite', 'TilingSprite', 'AnimatedSprite', 'Graphics', 'Text',
  'BitmapText', 'HTMLText', 'Mesh', 'PerspectiveMesh', 'MeshPlane', 'MeshRope',
  'MeshSimple', 'GifSprite',
]);

const LAYOUT_CONTAINER_VISUAL_ATTRIBUTES = new Set([
  'backgroundColor', 'borderColor', 'borderRadius', 'overflow',
]);

const LAYOUT_LEAF_ONLY_ATTRIBUTES = new Set(['objectFit', 'objectPosition']);

// Public scalar properties inherited by every PixiJS Container subclass.
// Object-valued transform properties stay code-behind only because XML strings
// cannot represent Point, Rectangle, Filter, or Texture instances safely.
const CONTAINER_PROPERTIES: Record<string, MarkupValueType> = {
  label: 'string',
  alpha: 'number',
  angle: 'number',
  rotation: 'number',
  visible: 'boolean',
  renderable: 'boolean',
  zIndex: 'number',
  sortableChildren: 'boolean',
  cullable: 'boolean',
  interactiveChildren: 'boolean',
  eventMode: 'string',
  cursor: 'string',
  tint: 'color',
  blendMode: 'string',
  roundPixels: 'boolean',
};

// Scalar TextStyle properties that are convenient and safe to express as XML
// attributes. Object-valued styles such as stroke, dropShadow, tagStyles and
// gradients continue to use prop.style or a Text.style property element.
const TEXT_STYLE_PROPERTIES: Readonly<Record<string, MarkupValueType>> = {
  align: 'string',
  breakWords: 'boolean',
  dropShadow: 'boolean',
  fill: 'color',
  fontFamily: 'string',
  fontSize: 'number|string',
  fontStyle: 'string',
  fontVariant: 'string',
  fontWeight: 'string',
  leading: 'number',
  letterSpacing: 'number',
  lineHeight: 'number',
  padding: 'number',
  textBaseline: 'string',
  trim: 'boolean',
  whiteSpace: 'string',
  wordWrap: 'boolean',
  wordWrapWidth: 'number',
};

const TEXT_COMPONENTS = new Set([
  'Text', 'BitmapText', 'HTMLText',
  'LayoutText', 'LayoutBitmapText', 'LayoutHTMLText',
]);

const ANCHOR_COMPONENTS = new Set([
  'Text', 'BitmapText', 'HTMLText',
  'Sprite', 'NineSliceSprite', 'TilingSprite', 'AnimatedSprite',
  'LayoutText', 'LayoutBitmapText', 'LayoutHTMLText',
  'LayoutSprite', 'LayoutNineSliceSprite', 'LayoutTilingSprite', 'LayoutAnimatedSprite',
]);

function isTextComponent(tagName?: string): boolean {
  if (!tagName) return false;
  const separator = tagName.lastIndexOf(':');
  return TEXT_COMPONENTS.has(separator >= 0 ? tagName.slice(separator + 1) : tagName);
}

function supportsAnchor(tagName?: string): boolean {
  if (!tagName) return false;
  const separator = tagName.lastIndexOf(':');
  return ANCHOR_COMPONENTS.has(separator >= 0 ? tagName.slice(separator + 1) : tagName);
}

function getTextStyleProperty(name: string, componentName?: string): string | null {
  if (!isTextComponent(componentName)) return null;
  const property = name.startsWith('style.') ? name.slice(6) : name;
  return TEXT_STYLE_PROPERTIES[property] ? property : null;
}

const BUILTIN_COMPONENTS = new Set([
  'LayoutContainer', 'LayoutView', 'LayoutSprite', 'LayoutNineSliceSprite',
  'LayoutTilingSprite', 'LayoutAnimatedSprite', 'LayoutGraphics', 'LayoutText',
  'LayoutBitmapText', 'LayoutHTMLText', 'LayoutMesh', 'LayoutPerspectiveMesh',
  'LayoutMeshPlane', 'LayoutMeshRope', 'LayoutMeshSimple', 'LayoutGifSprite',
  'Sprite', 'NineSliceSprite', 'TilingSprite', 'AnimatedSprite', 'Graphics',
  'Text', 'BitmapText', 'HTMLText', 'Mesh', 'PerspectiveMesh', 'MeshPlane',
  'MeshRope', 'MeshSimple', 'GifSprite',
]);

const PIXI_COMPONENTS = new Set([
  'Container', 'Sprite', 'NineSliceSprite', 'TilingSprite', 'AnimatedSprite',
  'Graphics', 'Text', 'BitmapText', 'HTMLText', 'Mesh', 'PerspectiveMesh',
  'MeshPlane', 'MeshRope', 'MeshSimple', 'GifSprite',
]);

// @pixi/ui is an optional peer dependency. These display-object classes can be
// used directly as XML tags without per-project component registration.
const PIXI_UI_COMPONENTS = new Set([
  'ButtonContainer', 'FancyButton', 'Input', 'CheckBox', 'Switcher', 'List',
  'MaskedFrame', 'ProgressBar', 'CircularProgressBar', 'RadioGroup', 'ScrollBox',
  'Select', 'Slider', 'DoubleSlider', 'Dialog',
]);

// Most @pixi/ui classes consume an options object. ButtonContainer and Switcher
// use positional constructors, so their XML attributes are assigned afterwards.
const PIXI_UI_OPTIONS_COMPONENTS = new Set([
  'FancyButton', 'Input', 'CheckBox', 'List', 'MaskedFrame', 'ProgressBar',
  'CircularProgressBar', 'RadioGroup', 'ScrollBox', 'Select', 'Slider',
  'DoubleSlider', 'Dialog',
]);

const GRAPHICS_COMMANDS = new Set([
  'Rect', 'RoundRect', 'Circle', 'Ellipse', 'MoveTo', 'LineTo',
  'BezierCurveTo', 'QuadraticCurveTo', 'Arc', 'ArcTo', 'ClosePath',
  'ArcToSvg', 'Star', 'RegularPoly', 'FilletRect', 'ChamferRect',
  'Poly', 'RoundPoly', 'RoundShape', 'Texture', 'Svg',
  'RotateTransform', 'ScaleTransform', 'TranslateTransform', 'SetTransform',
  'ResetTransform', 'BeginPath', 'Fill', 'Stroke', 'Cut', 'Save', 'Restore',
]);

const UI_PROPERTIES: Readonly<Record<string, readonly string[]>> = {
  ButtonContainer: ['enabled'],
  FancyButton: ['defaultView', 'hoverView', 'pressedView', 'disabledView', 'text', 'icon', 'padding', 'scale', 'anchor', 'anchorX', 'anchorY', 'offset', 'textOffset', 'iconOffset', 'defaultTextScale', 'defaultIconScale', 'defaultTextAnchor', 'defaultIconAnchor', 'animations', 'nineSliceSprite', 'contentFittingMode', 'ignoreRefitting', 'enabled'],
  Input: ['bg', 'textStyle', 'TextClass', 'placeholder', 'value', 'maxLength', 'secure', 'align', 'padding', 'cleanOnFocus', 'nineSliceSprite', 'addMask'],
  CheckBox: ['style', 'text', 'TextClass', 'checked'],
  List: ['type', 'elementsMargin', 'children', 'padding', 'vertPadding', 'horPadding', 'topPadding', 'bottomPadding', 'leftPadding', 'rightPadding', 'items', 'maxWidth', 'maxHeight'],
  MaskedFrame: ['target', 'mask', 'borderWidth', 'borderColor'],
  ProgressBar: ['bg', 'fill', 'fillPaddings', 'nineSliceSprite', 'progress'],
  CircularProgressBar: ['backgroundColor', 'fillColor', 'lineWidth', 'radius', 'value', 'backgroundAlpha', 'fillAlpha', 'cap', 'progress'],
  ScrollBox: ['width', 'height', 'background', 'type', 'radius', 'disableDynamicRendering', 'disableEasing', 'dragTrashHold', 'globalScroll', 'shiftScroll', 'proximityRange', 'proximityDebounce', 'disableProximityCheck', 'elementsMargin', 'padding', 'vertPadding', 'horPadding', 'topPadding', 'bottomPadding', 'leftPadding', 'rightPadding', 'items', 'maxWidth', 'maxHeight'],
  Select: ['closedBG', 'openBG', 'textStyle', 'TextClass', 'selected', 'selectedTextOffset', 'items', 'scrollBoxOffset', 'scrollBoxWidth', 'scrollBoxHeight', 'scrollBoxRadius', 'visibleItems', 'scrollBox'],
  Slider: ['bg', 'fill', 'fillPaddings', 'nineSliceSprite', 'min', 'max', 'valueTextStyle', 'valueTextClass', 'showValue', 'valueTextOffset', 'slider', 'step', 'value'],
  DoubleSlider: ['bg', 'fill', 'fillPaddings', 'nineSliceSprite', 'min', 'max', 'valueTextStyle', 'valueTextClass', 'showValue', 'valueTextOffset', 'slider1', 'slider2', 'value1', 'value2'],
  Dialog: ['backdrop', 'backdropColor', 'backdropAlpha', 'background', 'title', 'content', 'width', 'height', 'padding', 'buttons', 'buttonList', 'scrollBox', 'animations', 'closeOnBackdropClick', 'nineSliceSprite'],
  RadioGroup: ['items', 'type', 'elementsMargin', 'selectedItem'],
  Switcher: ['activeView', 'enabled'],
};

const UI_SIGNALS: Readonly<Record<string, readonly string[]>> = {
  ButtonContainer: ['onDown', 'onUp', 'onUpOut', 'onOut', 'onPress', 'onHover'],
  FancyButton: ['onDown', 'onUp', 'onUpOut', 'onOut', 'onPress', 'onHover'],
  Input: ['onChange', 'onEnter'],
  CheckBox: ['onCheck'], Slider: ['onUpdate', 'onChange'],
  DoubleSlider: ['onUpdate', 'onChange'], Dialog: ['onSelect', 'onClose'],
  Select: ['onSelect'], ScrollBox: ['onScroll', 'onProximityChange'],
  RadioGroup: ['onChange'], Switcher: ['onChange'],
};

const UI_REQUIRED_CONSTRUCTOR_PROPERTIES: Readonly<Record<string, readonly string[]>> = {
  Input: ['bg'],
  CheckBox: ['style'],
  Slider: ['slider'],
  Dialog: ['background'],
};

const FORBIDDEN_REFERENCE_NAMES = new Set([
  '__proto__', 'constructor', 'prototype', 'refs',
]);

function isBuiltinComponent(tagName: string): boolean {
  return BUILTIN_COMPONENTS.has(tagName)
    || PIXI_COMPONENTS.has(tagName)
    || PIXI_UI_COMPONENTS.has(tagName);
}

function usesOptionsConstructor(tagName: string): boolean {
  return BUILTIN_COMPONENTS.has(tagName) || PIXI_UI_OPTIONS_COMPONENTS.has(tagName);
}

export function compileMarkup(
  source: string,
  options: CompileMarkupOptions = {},
): MarkupNode {
  const validation = XMLValidator.validate(source);
  if (validation !== true) {
    throw new MarkupCompileError(validation.err.msg, {
      fileName: options.fileName,
      line: validation.err.line,
      column: validation.err.col,
      code: 'INVALID_XML',
    });
  }
  let parsed: Array<Record<string, unknown>>;
  try {
    parsed = parser.parse(source) as Array<Record<string, unknown>>;
  } catch (error) {
    throw createDiagnostic(source, error instanceof Error ? error.message : String(error), options);
  }
  const rootRecord = parsed.find((record) => getTagName(record) !== null);

  if (!rootRecord) {
    throw createDiagnostic(source, 'XML markup does not contain a root element.', options);
  }

  const root = convertNode(rootRecord);
  INLINE_NAMESPACES.set(root, extractInlineNamespaces(root, source, options));
  if (root.tagName !== 'LayoutContainer' && root.tagName !== 'Container') {
    throw createDiagnostic(
      source,
      'The UI root component must be LayoutContainer or Container.',
      options,
      root.tagName,
      'INVALID_ROOT',
    );
  }

  validateReferences(root);
  validateLayoutSemantics(root, source, options);

  return root;
}

function extractInlineNamespaces(
  root: MarkupNode,
  source: string,
  options: CompileMarkupOptions,
): Record<string, string> {
  const namespaces: Record<string, string> = {};
  for (const [name, value] of Object.entries(root.attributes)) {
    if (name === 'xmlns') {
      throw createDiagnostic(
        source,
        'The default XML namespace is not supported. Use a named namespace such as xmlns:ui="./ui".',
        options,
        name,
        'DEFAULT_NAMESPACE_NOT_SUPPORTED',
      );
    }
    if (!name.startsWith('xmlns:')) continue;
    const prefix = name.slice(6);
    if (!/^[A-Za-z_$][\w$.-]*$/.test(prefix) || prefix === 'xml' || prefix === 'xmlns') {
      throw createDiagnostic(source, `Invalid XML namespace prefix: ${prefix}`, options, name, 'INVALID_NAMESPACE_PREFIX');
    }
    if (!value.trim()) {
      throw createDiagnostic(source, `XML namespace ${prefix} requires a source.`, options, name, 'INVALID_NAMESPACE_SOURCE');
    }
    if (value.includes('\\')) {
      throw createDiagnostic(
        source,
        `XML namespace ${prefix} must use forward slashes.`,
        options,
        name,
        'INVALID_NAMESPACE_SOURCE',
      );
    }
    namespaces[prefix] = value.trim();
    delete root.attributes[name];
  }

  const rejectNestedDeclarations = (node: MarkupNode): void => {
    for (const child of node.children) {
      const declaration = Object.keys(child.attributes).find(
        (name) => name === 'xmlns' || name.startsWith('xmlns:'),
      );
      if (declaration) {
        throw createDiagnostic(
          source,
          'XML namespaces must be declared on the root element.',
          options,
          declaration,
          'NESTED_NAMESPACE_NOT_SUPPORTED',
        );
      }
      rejectNestedDeclarations(child);
    }
  };
  rejectNestedDeclarations(root);
  return namespaces;
}

function withInlineNamespaces(
  root: MarkupNode,
  source: string,
  options: CompileMarkupOptions,
): CompileMarkupOptions {
  const declarations = INLINE_NAMESPACES.get(root) ?? {};
  const inline: Record<string, MarkupNamespaceDefinition> = {};
  for (const [prefix, namespaceSource] of Object.entries(declarations)) {
    if (namespaceSource.startsWith('./') || namespaceSource.startsWith('../')) {
      const markupDirectory = dirname(resolve(options.fileName ?? 'markup.xml'));
      inline[prefix] = { directory: resolve(markupDirectory, namespaceSource) };
    } else if (isAbsolute(namespaceSource)) {
      throw createDiagnostic(
        source,
        `XML namespace ${prefix} cannot use an absolute path.`,
        options,
        `xmlns:${prefix}`,
        'INVALID_NAMESPACE_SOURCE',
      );
    } else {
      inline[prefix] = { module: namespaceSource, importMode: 'named' };
    }
  }
  return {
    ...options,
    namespaces: { ...options.namespaces, ...inline },
  };
}

export function compileMarkupModule(
  source: string,
  options: CompileMarkupOptions = {},
): string {
  const root = compileMarkup(source, options);
  const resolvedOptions = withInlineNamespaces(root, source, options);
  validatePropertyElements(root, source, resolvedOptions);
  validateComponentMetadata(root, source, resolvedOptions);
  const definitions = resolvedOptions.components ?? {};
  const usedTags = new Set<string>();
  const collectValueTags = (value: MarkupNode): void => {
    if (value.tagName === 'Object') {
      for (const child of value.children) for (const nested of child.children) collectValueTags(nested);
      return;
    }
    if (value.tagName === 'Array') {
      for (const child of value.children) collectValueTags(child);
      return;
    }
    if (value.tagName === 'Value') return;
    usedTags.add(value.tagName);
    collectTags(value);
  };
  const collectTags = (node: MarkupNode): void => {
    for (const child of node.children) {
      if (getPropertyElementName(node, child)) {
        for (const value of child.children) {
          collectValueTags(value);
        }
      } else if (isGraphicsCommand(node, child)) {
        continue;
      } else {
        usedTags.add(child.tagName);
        collectTags(child);
      }
    }
  };
  collectTags(root);

  const staticGraphics = new Map<MarkupNode, string>();
  const mutableUiViewProperties = new Set([
    'defaultView', 'hoverView', 'pressedView', 'disabledView', 'icon',
  ]);
  const collectStaticGraphics = (node: MarkupNode, mutableUiView = false): void => {
    if (!mutableUiView && isGraphicsTag(node.tagName)
      && node.children.some((child) => isGraphicsCommand(node, child))
      && node.children.every((child) => isGraphicsCommand(node, child))
      && node.children.every((child) =>
        Object.values(child.attributes).every((value) => !value.includes('{') && !value.startsWith('@asset(')))) {
      staticGraphics.set(node, `__MarkupGraphicsContext${staticGraphics.size}`);
    }
    for (const child of node.children) {
      const propertyName = getPropertyElementName(node, child);
      if (propertyName || !isGraphicsCommand(node, child)) {
        const childIsMutableUiView = mutableUiView
          || (node.tagName === 'FancyButton'
            && propertyName !== null
            && mutableUiViewProperties.has(propertyName));
        for (const nested of propertyName ? child.children : [child]) {
          collectStaticGraphics(nested, childIsMutableUiView);
        }
      }
    }
  };
  collectStaticGraphics(root);

  const imports: string[] = requiresLayoutRuntime(root) ? ['import "@pixi/layout";'] : [];
  if (containsAssetReference(root)) {
    imports.push('import { Assets as __MarkupAssets } from "pixi.js";');
  }
  if (staticGraphics.size > 0) {
    imports.push('import { GraphicsContext as __MarkupGraphicsContext } from "pixi.js";');
  }
  const identifiers = new Map<string, string>();
  for (const tagName of usedTags) {
    const resolved = resolveComponent(tagName, resolvedOptions, false, source);
    const definition = definitions[tagName] ?? {};
    const identifier = `__Markup${identifiers.size}`;
    identifiers.set(tagName, identifier);
    const exported = definition.export ?? resolved.exported;
    const moduleName = definition.module ?? resolved.moduleName;
    imports.push(`import { ${exported} as ${identifier} } from ${JSON.stringify(moduleName)};`);
  }

  const staticLines: string[] = [];
  for (const [node, identifier] of staticGraphics) {
    staticLines.push(`const ${identifier} = new __MarkupGraphicsContext();`);
    emitGraphicsCommands(staticLines, identifier, node.children, '');
  }
  const lines = [...imports, ...staticLines, 'export default function render(target, refs) {'];
  emitAttributes(lines, 'target', root.attributes, false, false, root.tagName);
  let nextId = 0;

  const emitValue = (value: MarkupNode): string => {
    if (value.tagName === 'Object') return compileObjectLiteral(value);
    if (value.tagName === 'Array') {
      return `[${value.children.map((item) => emitValue(item)).join(', ')}]`;
    }
    if (value.tagName === 'Value') {
      if (value.children.length > 0 || value.attributes.value === undefined) {
        throw new Error('Value requires a value attribute and cannot contain children.');
      }
      return compileStaticValue(value.attributes.value);
    }
    return emitNode(value);
  };

  const emitNode = (node: MarkupNode): string => {
    const propertyValues = new Map<string, string>();
    const regularChildren: MarkupNode[] = [];
    for (const child of node.children) {
      const propertyName = getPropertyElementName(node, child);
      if (!propertyName) {
        if (!isGraphicsCommand(node, child)) regularChildren.push(child);
        continue;
      }
      const value = child.children[0];
      if (!value) throw new Error(`Property element ${child.tagName} requires one child component.`);
      propertyValues.set(propertyName, emitValue(value));
    }
    if (node.tagName === 'LayoutView' && regularChildren.length === 1) {
      propertyValues.set('slot', emitNode(regularChildren[0]));
      regularChildren.length = 0;
    }
    const variable = `node${nextId++}`;
    const definition = definitions[node.tagName] ?? {};
    const constructor = identifiers.get(node.tagName);
    if (!constructor) throw new Error(`Missing component import: ${node.tagName}`);
    const sharedContext = staticGraphics.get(node);
    const constructorArguments = sharedContext
      ? `{ context: ${sharedContext} }`
      : compileConstructorArguments(node, definition, propertyValues);
    lines.push(`  const ${variable} = new ${constructor}(${constructorArguments});`);
    emitAttributes(lines, variable, node.attributes, true, usesOptionsConstructor(node.tagName), node.tagName);
    if (isGraphicsTag(node.tagName) && !sharedContext) emitGraphicsCommands(lines, variable, node.children);
    for (const child of regularChildren) {
      const childVariable = emitNode(child);
      const appendMethod = node.tagName === 'ScrollBox' ? 'addItem' : 'addChild';
      lines.push(`  ${variable}.${appendMethod}(${childVariable});`);
    }
    return variable;
  };

  for (const child of root.children) {
    const variable = emitNode(child);
    lines.push(`  target.addChild(${variable});`);
  }
  lines.push('}');
  return lines.join('\n');
}

export function compileMarkupClassModule(source: string, fileName?: string): string | null {
  const sourceFile = ts.createSourceFile(
    'MarkupContainer.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const imports: string[] = [];
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const importedBases = new Map<string, 'Container' | 'LayoutContainer'>();
  const namespaceImports = new Set<string>();
  const runtimeImports = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const importClause = statement.importClause;
    if (!importClause || importClause.isTypeOnly) continue;
    if (importClause.name) runtimeImports.add(importClause.name.text);
    const bindings = importClause.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) runtimeImports.add(bindings.name.text);
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if (!element.isTypeOnly) runtimeImports.add(element.name.text);
      }
    }
  }
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.getText(sourceFile).replace(/["']/g, '') !== 'pixi-layout-markup') continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) namespaceImports.add(bindings.name.text);
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        const imported = element.propertyName?.text ?? element.name.text;
        if (imported === 'MarkupContainer') importedBases.set(element.name.text, 'Container');
        if (imported === 'MarkupLayoutContainer') importedBases.set(element.name.text, 'LayoutContainer');
      }
    }
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || !statement.name) continue;
    let expectedRoot: 'Container' | 'LayoutContainer' | undefined;
    for (const clause of statement.heritageClauses ?? []) {
      if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;
      for (const { expression } of clause.types) {
        if (ts.isIdentifier(expression)) expectedRoot = importedBases.get(expression.text);
        else if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)
          && namespaceImports.has(expression.expression.text)) {
          if (expression.name.text === 'MarkupContainer') expectedRoot = 'Container';
          if (expression.name.text === 'MarkupLayoutContainer') expectedRoot = 'LayoutContainer';
        }
      }
    }
    if (!expectedRoot) continue;

    const className = statement.name.text;
    let importedMarkupBindings: string[] = [];
    if (fileName) {
      const markupFile = resolve(dirname(fileName), `${className}.xml`);
      if (!existsSync(markupFile)) throw new Error(`${className} requires matching markup file: ${markupFile}`);
      const markupRoot = compileMarkup(readFileSync(markupFile, 'utf8'), { fileName: markupFile });
      const actualRoot = markupRoot.tagName;
      if (actualRoot !== expectedRoot) {
        throw new Error(`${className} extends ${expectedRoot === 'Container' ? 'MarkupContainer' : 'MarkupLayoutContainer'} but ${className}.xml uses <${actualRoot}>; expected <${expectedRoot}>.`);
      }
      const classMembers = new Set(statement.members.flatMap((member) =>
        member.name && ts.isIdentifier(member.name) ? [member.name.text] : []));
      importedMarkupBindings = [...collectBindingRoots(markupRoot)]
        .filter((name) => runtimeImports.has(name) && !classMembers.has(name));
    }
    const identifier = `__${className}MarkupTemplate`;
    imports.push(`import ${identifier} from './${className}.xml';`);
    const constructor = statement.members.find(ts.isConstructorDeclaration);
    const superCall = constructor?.body?.statements.find(
      (member): member is ts.ExpressionStatement =>
        ts.isExpressionStatement(member)
        && ts.isCallExpression(member.expression)
        && member.expression.expression.kind === ts.SyntaxKind.SuperKeyword,
    );

    if (superCall && ts.isCallExpression(superCall.expression)) {
      const originalArguments = superCall.expression.arguments
        .map((argument) => argument.getText(sourceFile))
        .join(', ');
      const exposeImports = importedMarkupBindings
        .map((name) => `(this as any)[${JSON.stringify(name)}] = ${name}; `)
        .join('');
      edits.push({
        start: superCall.expression.getStart(sourceFile),
        end: superCall.expression.getEnd(),
        text: `super(${originalArguments}); ${exposeImports}this.applyMarkup(${identifier})`,
      });
    } else if (!constructor) {
      edits.push({
        start: statement.members.pos,
        end: statement.members.pos,
        text: `\n  public constructor() { super(); ${importedMarkupBindings.map((name) => `(this as any)[${JSON.stringify(name)}] = ${name}; `).join('')}this.applyMarkup(${identifier}); }`,
      });
    } else {
      throw new Error(`${className} constructor must call super() for markup injection.`);
    }
  }

  if (imports.length === 0) return null;
  let transformed = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    transformed = transformed.slice(0, edit.start) + edit.text + transformed.slice(edit.end);
  }
  return `${imports.join('\n')}\n${transformed}`;
}

function collectBindingRoots(root: MarkupNode): Set<string> {
  const roots = new Set<string>();
  const visit = (node: MarkupNode): void => {
    for (const value of Object.values(node.attributes)) {
      const binding = value.match(/^\{([A-Za-z_$][\w$]*)(?:\.[A-Za-z_$][\w$]*)*\}$/);
      if (binding) roots.add(binding[1]);
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
  return roots;
}

function requiresLayoutRuntime(root: MarkupNode): boolean {
  let required = root.tagName === 'LayoutContainer';
  const visit = (node: MarkupNode): void => {
    if (required) return;
    if (node.tagName.startsWith('Layout')
      || Object.keys(node.attributes).some((name) =>
        name === 'layout' || name === 'prop.layout' || name.startsWith('layout.') || LAYOUT_ATTRIBUTES.has(name))) {
      required = true;
      return;
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
  return required;
}

export function compileMarkupRefsDeclaration(
  source: string,
  viewName: string,
  options: CompileMarkupOptions = {},
): string {
  const root = compileMarkup(source, options);
  const resolvedOptions = withInlineNamespaces(root, source, options);
  const definitions = resolvedOptions.components ?? {};
  const references: Array<{ name: string; tagName: string }> = [];
  const names = new Set<string>();
  const bindings = new Set<string>();
  const visit = (node: MarkupNode): void => {
    const reference = getReferenceName(node);
    if (reference) {
      if (names.has(reference)) throw new Error(`Duplicate UI reference: ${reference}`);
      names.add(reference);
      references.push({ name: reference, tagName: node.tagName });
    }
    for (const value of Object.values(node.attributes)) {
      const binding = value.match(/^\{([A-Za-z_$][\w$]*)/);
      if (binding) bindings.add(binding[1]);
    }
    for (const child of node.children) visit(child);
  };
  visit(root);

  const typeImports = new Map<string, string>();
  const imports: string[] = [];
  for (const { tagName } of references) {
    if (typeImports.has(tagName)) continue;
    const definition = definitions[tagName] ?? {};
    const resolved = resolveComponent(tagName, resolvedOptions, true, source);
    const exported = definition.export ?? resolved.exported;
    const moduleName = definition.module ?? resolved.moduleName;
    const alias = `__MarkupRef${typeImports.size}`;
    typeImports.set(tagName, alias);
    imports.push(`import type { ${exported} as ${alias} } from ${JSON.stringify(moduleName)};`);
  }

  const properties = references.map(({ name, tagName }) =>
    `    readonly ${JSON.stringify(name)}: ${typeImports.get(tagName)};`,
  );
  const bindingProperties = [...bindings].map((name) =>
    `    ${JSON.stringify(name)}: any;`,
  );
  return [
    ...imports,
    `declare module ${JSON.stringify(resolveViewModule(viewName, resolvedOptions))} {`,
    `  interface ${viewName}Refs {`,
    ...properties,
    '  }',
    `  interface ${viewName}Bindings {`,
    ...bindingProperties,
    '  }',
    `  interface ${viewName} extends ${viewName}Refs, ${viewName}Bindings {}`,
    '}',
    'export {};',
    '',
  ].join('\n');
}

function resolveComponent(
  tagName: string,
  options: CompileMarkupOptions,
  fromDeclaration = false,
  source = '',
): { exported: string; moduleName: string } {
  const explicit = options.components?.[tagName];
  const separator = tagName.indexOf(':');
  const prefix = separator >= 0 ? tagName.slice(0, separator) : null;
  const localName = separator >= 0 ? tagName.slice(separator + 1) : tagName;
  const namespace = prefix ? options.namespaces?.[prefix] : undefined;
  const definition = typeof namespace === 'string' ? { module: namespace } : namespace;

  if (explicit?.module) {
    return { exported: explicit.export ?? localName, moduleName: explicit.module };
  }
  if (definition?.module) {
    return {
      exported: localName,
      moduleName: definition.importMode === 'named'
        ? definition.module
        : `${definition.module.replace(/\/$/, '')}/${localName}`,
    };
  }

  const sourceDirectory = dirname(options.fileName ?? '.');
  const declarationDirectory = dirname(options.declarationFileName ?? options.fileName ?? '.');
  const importDirectory = fromDeclaration ? declarationDirectory : sourceDirectory;
  const directories = definition?.directory
    ? [definition.directory]
    : prefix
      ? []
      : (options.componentDirs ?? []);

  for (const configuredDirectory of directories) {
    const directory = isAbsolute(configuredDirectory)
      ? configuredDirectory
      : resolve(options.rootDir ?? process.cwd(), configuredDirectory);
    const candidate = findComponentFile(directory, localName);
    if (candidate) {
      return { exported: localName, moduleName: toImportSpecifier(importDirectory, candidate) };
    }
  }

  if (prefix) {
    throw createDiagnostic(source, `Unknown XML namespace: ${prefix}`, options, tagName, 'UNKNOWN_NAMESPACE');
  }
  if (PIXI_COMPONENTS.has(localName)) return { exported: localName, moduleName: 'pixi.js' };
  if (PIXI_UI_COMPONENTS.has(localName)) return { exported: localName, moduleName: '@pixi/ui' };
  if (BUILTIN_COMPONENTS.has(localName)) {
    return { exported: localName, moduleName: '@pixi/layout/components' };
  }
  const sibling = resolve(sourceDirectory, localName);
  return {
    exported: localName,
    moduleName: fromDeclaration
      ? toImportSpecifier(declarationDirectory, sibling)
      : `./${localName}`,
  };
}

function validateComponentMetadata(
  root: MarkupNode,
  source: string,
  options: CompileMarkupOptions,
): void {
  const visit = (node: MarkupNode): void => {
    const metadata = options.componentMetadata?.[node.tagName]
      ?? getPixiUiMetadata(node.tagName)
      ?? inferComponentMetadata(node.tagName, options);
    for (const required of UI_REQUIRED_CONSTRUCTOR_PROPERTIES[node.tagName] ?? []) {
      const hasAttribute = node.attributes[required] !== undefined || node.attributes[`prop.${required}`] !== undefined;
      const hasPropertyElement = node.children.some((child) => getPropertyElementName(node, child) === required);
      if (!hasAttribute && !hasPropertyElement) {
        throw createDiagnostic(source, `${node.tagName} requires constructor property ${required}. Use prop.${required} or <${node.tagName}.${required}>.`, options, node.tagName, 'MISSING_CONSTRUCTOR_PROPERTY');
      }
    }
    if (metadata?.allowChildren === false && node.children.length > 0) {
      throw createDiagnostic(
        source,
        `${node.tagName} does not allow child elements.`,
        options,
        node.tagName,
        'CHILDREN_NOT_ALLOWED',
      );
    }

    for (const [rawName, value] of Object.entries(node.attributes)) {
      if (rawName === 'ref') {
        throw createDiagnostic(
          source,
          'The XML ref attribute has been removed. Use id instead.',
          options,
          rawName,
          'REMOVED_REF_ATTRIBUTE',
        );
      }
      if (rawName === 'id' || rawName === 'style' || rawName === 'if' || rawName === 'layout') continue;
      if (rawName === 'prop.layout') continue;
      if (rawName === 'anchor' && supportsAnchor(node.tagName)) {
        validateAnchorValue(value, source, options);
        continue;
      }
      const textStyleProperty = getTextStyleProperty(rawName, node.tagName);
      if (textStyleProperty) {
        validateStaticType(value, TEXT_STYLE_PROPERTIES[textStyleProperty], source, options, rawName);
        continue;
      }
      if (rawName.startsWith('layout.') || LAYOUT_ATTRIBUTES.has(rawName)) {
        const layoutName = rawName.startsWith('layout.') ? rawName.slice(7) : rawName;
        const layoutType = LAYOUT_ATTRIBUTE_TYPES[layoutName];
        if (layoutType) validateStaticType(value, layoutType, source, options, rawName);
        continue;
      }
      if (rawName.startsWith('signal.')) {
        const signalName = rawName.slice(7);
        if (metadata?.signals && !metadata.signals.includes(signalName)) {
          const suggestion = findSuggestion(signalName, [...metadata.signals]);
          throw createDiagnostic(
            source,
            `Unknown signal ${signalName} on ${node.tagName}.${suggestion ? ` Did you mean ${suggestion}?` : ''}`,
            options,
            rawName,
            'UNKNOWN_SIGNAL',
          );
        }
        continue;
      }
      if (rawName.startsWith('on')) {
        const eventName = rawName.slice(2).toLowerCase();
        if (metadata?.events && !metadata.events.some((event) => event.toLowerCase() === eventName)) {
          throw createDiagnostic(
            source,
            `Unknown event ${rawName} on ${node.tagName}.`,
            options,
            rawName,
            'UNKNOWN_EVENT',
          );
        }
        continue;
      }

      const name = rawName.startsWith('prop.')
        ? rawName.slice(5)
        : rawName.startsWith('set.')
          ? rawName.slice(4)
          : rawName;
      const property = metadata?.properties?.[name] ?? CONTAINER_PROPERTIES[name];
      if (!property && metadata?.strict) {
        const candidates = [
          ...Object.keys(metadata.properties ?? {}),
          ...Object.keys(CONTAINER_PROPERTIES),
        ];
        const suggestion = findSuggestion(name, candidates);
        throw createDiagnostic(
          source,
          `Unknown property ${name} on ${node.tagName}.${suggestion ? ` Did you mean ${suggestion}?` : ''}`,
          options,
          rawName,
          'UNKNOWN_PROPERTY',
        );
      }
      if (property) {
        const type = typeof property === 'string' ? property : property.type ?? 'any';
        validateStaticType(value, type, source, options, rawName);
      }
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
}

function getPixiUiMetadata(tagName: string): MarkupComponentMetadata | undefined {
  if (!PIXI_UI_COMPONENTS.has(tagName)) return undefined;
  return {
    properties: Object.fromEntries((UI_PROPERTIES[tagName] ?? []).map((name) => [name, 'any'])),
    signals: UI_SIGNALS[tagName] ?? [],
    strict: true,
  };
}

function validatePropertyElements(
  root: MarkupNode,
  source: string,
  options: CompileMarkupOptions,
): void {
  const visit = (node: MarkupNode): void => {
    const names = new Set<string>();
    for (const child of node.children) {
      const propertyName = getPropertyElementName(node, child);
      if (!propertyName) {
        if (isGraphicsCommand(node, child)) {
          validateGraphicsCommand(child, source, options);
          continue;
        }
        if (isGraphicsTag(node.tagName)) {
          const suggestion = findSuggestion(child.tagName, [...GRAPHICS_COMMANDS]);
          throw createDiagnostic(
            source,
            `Unknown Graphics command ${child.tagName}.${suggestion ? ` Did you mean ${suggestion}?` : ''}`,
            options,
            child.tagName,
            'UNKNOWN_GRAPHICS_COMMAND',
          );
        }
        visit(child);
        continue;
      }
      if (!usesOptionsConstructor(node.tagName) && !options.components?.[node.tagName]?.options) {
        throw createDiagnostic(
          source,
          `${node.tagName} does not accept constructor property elements.`,
          options,
          child.tagName,
          'PROPERTY_ELEMENT_NOT_SUPPORTED',
        );
      }
      if (names.has(propertyName)) {
        throw createDiagnostic(
          source,
          `Duplicate property element ${child.tagName}.`,
          options,
          child.tagName,
          'DUPLICATE_PROPERTY_ELEMENT',
        );
      }
      if (Object.keys(child.attributes).length > 0 || child.children.length !== 1) {
        throw createDiagnostic(
          source,
          `${child.tagName} must contain exactly one component and cannot have attributes.`,
          options,
          child.tagName,
          'INVALID_PROPERTY_ELEMENT',
        );
      }
      names.add(propertyName);
      if (child.children[0].tagName !== 'Object') visit(child.children[0]);
    }
  };
  visit(root);
}

function validateGraphicsCommand(
  command: MarkupNode,
  source: string,
  options: CompileMarkupOptions,
): void {
  const required: Readonly<Record<string, readonly string[]>> = {
    Rect: ['x', 'y', 'width', 'height'], RoundRect: ['x', 'y', 'width', 'height', 'radius'],
    Circle: ['x', 'y', 'radius'], Ellipse: ['x', 'y', 'halfWidth', 'halfHeight'],
    MoveTo: ['x', 'y'], LineTo: ['x', 'y'],
    BezierCurveTo: ['cp1x', 'cp1y', 'cp2x', 'cp2y', 'x', 'y'],
    QuadraticCurveTo: ['cpx', 'cpy', 'x', 'y'],
    Arc: ['x', 'y', 'radius', 'startAngle', 'endAngle'],
    ArcTo: ['x1', 'y1', 'x2', 'y2', 'radius'],
    ArcToSvg: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'],
    Star: ['x', 'y', 'points', 'radius'], RegularPoly: ['x', 'y', 'radius', 'sides'],
    FilletRect: ['x', 'y', 'width', 'height', 'fillet'],
    ChamferRect: ['x', 'y', 'width', 'height', 'chamfer'],
    Poly: ['points'], RoundPoly: ['x', 'y', 'radius', 'sides', 'corner'],
    RoundShape: ['points', 'radius'], Texture: ['texture'], Svg: ['value'],
    RotateTransform: ['angle'], ScaleTransform: ['x', 'y'],
    TranslateTransform: ['x', 'y'], SetTransform: ['a', 'b', 'c', 'd', 'dx', 'dy'],
  };
  for (const attribute of required[command.tagName] ?? []) {
    if (command.attributes[attribute] !== undefined) continue;
    throw createDiagnostic(
      source,
      `${command.tagName} requires attribute ${attribute}.`,
      options,
      command.tagName,
      'MISSING_GRAPHICS_ATTRIBUTE',
    );
  }
}

function inferComponentMetadata(
  tagName: string,
  options: CompileMarkupOptions,
): MarkupComponentMetadata | undefined {
  if (isBuiltinComponent(tagName)) return undefined;
  const separator = tagName.indexOf(':');
  const prefix = separator >= 0 ? tagName.slice(0, separator) : null;
  const localName = separator >= 0 ? tagName.slice(separator + 1) : tagName;
  const namespace = prefix ? options.namespaces?.[prefix] : undefined;
  const definition = typeof namespace === 'string' ? { module: namespace } : namespace;
  if (definition?.module) return undefined;
  const directories = definition?.directory
    ? [definition.directory]
    : (options.componentDirs ?? []);
  for (const configuredDirectory of directories) {
    const directory = isAbsolute(configuredDirectory)
      ? configuredDirectory
      : resolve(options.rootDir ?? process.cwd(), configuredDirectory);
    const modulePath = findComponentSourceFile(directory, localName);
    if (!modulePath) continue;
    const sourceFile = ts.createSourceFile(
      modulePath,
      readFileSync(modulePath, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      modulePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const properties: Record<string, MarkupValueType> = {};
    for (const statement of sourceFile.statements) {
      if (!ts.isClassDeclaration(statement) || statement.name?.text !== localName) continue;
      for (const member of statement.members) {
        if (!member.name || !ts.isIdentifier(member.name)) continue;
        if (ts.isSetAccessor(member)) {
          properties[member.name.text] = inferType(member.parameters[0]?.type);
        } else if (ts.isPropertyDeclaration(member) || ts.isGetAccessor(member)) {
          properties[member.name.text] = inferType(member.type);
        }
      }
    }
    return { properties, strict: true };
  }
  return undefined;
}

function inferType(node: ts.TypeNode | undefined): MarkupValueType {
  if (!node) return 'any';
  if (node.kind === ts.SyntaxKind.StringKeyword) return 'string';
  if (node.kind === ts.SyntaxKind.NumberKeyword) return 'number';
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return 'boolean';
  return 'any';
}

function validateStaticType(
  value: string,
  type: MarkupValueType,
  source: string,
  options: CompileMarkupOptions,
  token: string,
): void {
  const deferred = /^\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\}$/.test(value)
    || /^@asset\([^)]+\)$/.test(value);
  const valid = deferred || type === 'any' || type === 'string'
    || (type === 'number' && /^-?\d+(\.\d+)?$/.test(value))
    || type === 'number|string'
    || (type === 'boolean' && (value === 'true' || value === 'false'))
    || (type === 'color' && (/^(#([\da-f]{6}|[\da-f]{8})|0x[\da-f]+|rgba?\(.+\))$/i.test(value)));
  if (!valid) {
    throw createDiagnostic(
      source,
      `Expected ${type} value for ${token}, received ${JSON.stringify(value)}.`,
      options,
      token,
      'INVALID_ATTRIBUTE_VALUE',
    );
  }
}

function validateAnchorValue(
  value: string,
  source: string,
  options: CompileMarkupOptions,
): void {
  const binding = /^\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\}$/.test(value);
  const number = /^-?\d+(\.\d+)?$/.test(value.trim());
  const point = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(value);
  if (binding || number || point) return;
  throw createDiagnostic(
    source,
    `Expected anchor as a number, x,y pair, or binding; received ${JSON.stringify(value)}.`,
    options,
    'anchor',
    'INVALID_ATTRIBUTE_VALUE',
  );
}

function findSuggestion(value: string, candidates: string[]): string | null {
  let best: { value: string; distance: number } | null = null;
  for (const candidate of candidates) {
    const distance = editDistance(value, candidate);
    if (!best || distance < best.distance) best = { value: candidate, distance };
  }
  return best && best.distance <= Math.max(2, Math.floor(value.length / 3)) ? best.value : null;
}

function editDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const above = row[rightIndex];
      row[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal, above, row[rightIndex - 1]) + 1;
      diagonal = above;
    }
  }
  return row[right.length];
}

function createDiagnostic(
  source: string,
  message: string,
  options: CompileMarkupOptions = {},
  token?: string,
  code?: string,
): MarkupCompileError {
  const index = token ? Math.max(0, source.indexOf(token)) : 0;
  const before = source.slice(0, index);
  const lines = before.split(/\r?\n/);
  return new MarkupCompileError(message, {
    fileName: options.fileName,
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
    code,
  });
}

function findComponentFile(directory: string, componentName: string): string | null {
  const source = findComponentSourceFile(directory, componentName);
  return source ? source.slice(0, -extname(source).length) : null;
}

function findComponentSourceFile(directory: string, componentName: string): string | null {
  for (const extension of ['.ts', '.tsx', '.js', '.mjs']) {
    const candidate = resolve(directory, `${componentName}${extension}`);
    if (existsSync(candidate)) return candidate;
  }
  for (const extension of ['.ts', '.tsx', '.js', '.mjs']) {
    const candidate = resolve(directory, componentName, `index${extension}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function toImportSpecifier(fromDirectory: string, target: string): string {
  let value = relative(fromDirectory, target).split(sep).join('/');
  if (!value.startsWith('.')) value = `./${value}`;
  return value;
}

function resolveViewModule(viewName: string, options: CompileMarkupOptions): string {
  if (!options.declarationFileName || !options.fileName) return `./${viewName}`;
  const target = resolve(dirname(options.fileName), viewName);
  return toImportSpecifier(dirname(options.declarationFileName), target);
}

function compileConstructorArguments(
  node: MarkupNode,
  definition: CompiledComponentDefinition,
  propertyValues: ReadonlyMap<string, string> = new Map(),
): string {
  if (definition.options) {
    const entries = Object.entries(definition.options).map(
      ([name, source]) => `${JSON.stringify(name)}: ${compileValue(node, source)}`,
    );
    for (const [name, value] of propertyValues) entries.push(`${JSON.stringify(name)}: ${value}`);
    return `{ ${entries.join(', ')} }`;
  }
  if (!definition.arguments) {
    if (!usesOptionsConstructor(node.tagName)) {
      if (propertyValues.size > 0) {
        throw new Error(`${node.tagName} does not accept XML property elements in its constructor.`);
      }
      return '';
    }
    const entries = Object.entries(node.attributes)
      .filter(([name]) => isConstructorAttribute(name, node.tagName))
      .map(([name]) => {
        const property = name.startsWith('prop.') ? name.slice(5) : name;
        const transform: CompiledValueTransform = name === 'text'
          ? 'resolve'
          : name.startsWith('on')
            ? 'action'
            : 'evaluate';
        const compiledValue = name === 'anchor' && supportsAnchor(node.tagName)
          ? compileAnchorValue(node.attributes[name])
          : compileValue(node, { attribute: name, transform });
        return `${JSON.stringify(property)}: ${compiledValue}`;
      });
    for (const [name, value] of propertyValues) entries.push(`${JSON.stringify(name)}: ${value}`);
    return `{ ${entries.join(', ')} }`;
  }
  if (propertyValues.size > 0) {
    throw new Error(`${node.tagName} uses positional constructor arguments and cannot accept XML property elements.`);
  }
  return (definition.arguments ?? [])
    .map((source) => compileValue(node, source))
    .join(', ');
}

function getPropertyElementName(parent: MarkupNode, child: MarkupNode): string | null {
  const separator = parent.tagName.lastIndexOf(':');
  const localParentName = separator >= 0 ? parent.tagName.slice(separator + 1) : parent.tagName;
  const prefix = `${localParentName}.`;
  return child.tagName.startsWith(prefix) ? child.tagName.slice(prefix.length) || null : null;
}

function isGraphicsTag(tagName: string): boolean {
  const separator = tagName.lastIndexOf(':');
  const localName = separator >= 0 ? tagName.slice(separator + 1) : tagName;
  return localName === 'Graphics' || localName === 'LayoutGraphics';
}

function isGraphicsCommand(parent: MarkupNode, child: MarkupNode): boolean {
  return isGraphicsTag(parent.tagName) && GRAPHICS_COMMANDS.has(child.tagName);
}

function compileObjectLiteral(node: MarkupNode): string {
  const entries = Object.entries(node.attributes).map(([name, value]) => {
    if (FORBIDDEN_REFERENCE_NAMES.has(name)) throw new Error(`Reserved object property name: ${name}`);
    return `${JSON.stringify(name)}: ${compileStaticValue(value)}`;
  });
  for (const child of node.children) {
    const separator = child.tagName.lastIndexOf('.');
    if (separator < 0) throw new Error(`Object child ${child.tagName} must use Object.property syntax.`);
    const name = child.tagName.slice(separator + 1);
    if (!name) throw new Error(`Invalid object property element ${child.tagName}.`);
    if (FORBIDDEN_REFERENCE_NAMES.has(name)) throw new Error(`Reserved object property name: ${name}`);
    let value: string;
    if (child.children.length === 0) {
      value = compileObjectLiteral({ ...child, tagName: 'Object' });
    } else if (child.children.length === 1 && child.children[0].tagName === 'Object') {
      const inner = child.children[0];
      value = compileObjectLiteral({
        tagName: 'Object',
        attributes: { ...inner.attributes, ...child.attributes },
        children: inner.children,
      });
    } else {
      throw new Error(`${child.tagName} must contain one Object or use attributes as its value.`);
    }
    entries.push(`${JSON.stringify(name)}: ${value}`);
  }
  return `{ ${entries.join(', ')} }`;
}

function emitGraphicsCommands(
  lines: string[],
  variable: string,
  children: MarkupNode[],
  indent = '  ',
): void {
  for (const command of children) {
    if (!GRAPHICS_COMMANDS.has(command.tagName)) continue;
    const attributes = command.attributes;
    const positional: Record<string, string[]> = {
      Rect: ['x', 'y', 'width', 'height'],
      RoundRect: ['x', 'y', 'width', 'height', 'radius'],
      Circle: ['x', 'y', 'radius'],
      Ellipse: ['x', 'y', 'halfWidth', 'halfHeight'],
      MoveTo: ['x', 'y'], LineTo: ['x', 'y'],
      BezierCurveTo: ['cp1x', 'cp1y', 'cp2x', 'cp2y', 'x', 'y'],
      QuadraticCurveTo: ['cpx', 'cpy', 'x', 'y'],
      Arc: ['x', 'y', 'radius', 'startAngle', 'endAngle', 'counterclockwise'],
      ArcTo: ['x1', 'y1', 'x2', 'y2', 'radius'],
      ArcToSvg: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'],
      Star: ['x', 'y', 'points', 'radius', 'innerRadius', 'rotation'],
      RegularPoly: ['x', 'y', 'radius', 'sides', 'rotation'],
      FilletRect: ['x', 'y', 'width', 'height', 'fillet'],
      ChamferRect: ['x', 'y', 'width', 'height', 'chamfer'],
      Poly: ['points', 'close'], RoundPoly: ['x', 'y', 'radius', 'sides', 'corner', 'rotation'],
      RoundShape: ['points', 'radius', 'useQuadratic', 'smoothness'],
      Texture: ['texture', 'tint', 'dx', 'dy', 'dw', 'dh'], Svg: ['value'],
      RotateTransform: ['angle'], ScaleTransform: ['x', 'y'],
      TranslateTransform: ['x', 'y'], SetTransform: ['a', 'b', 'c', 'd', 'dx', 'dy'],
    };
    if (command.tagName === 'Fill') {
      const keys = Object.keys(attributes);
      const argument = keys.length === 1 && keys[0] === 'color'
        ? compileStaticValue(attributes.color)
        : compileObjectLiteral({ ...command, tagName: 'Object' });
      lines.push(`${indent}${variable}.fill(${argument});`);
    } else if (command.tagName === 'Stroke') {
      lines.push(`${indent}${variable}.stroke(${compileObjectLiteral({ ...command, tagName: 'Object' })});`);
    } else if (['ClosePath', 'Cut', 'BeginPath', 'Save', 'Restore', 'ResetTransform'].includes(command.tagName)) {
      const method = command.tagName[0].toLowerCase() + command.tagName.slice(1);
      lines.push(`${indent}${variable}.${method}();`);
    } else {
      const names = positional[command.tagName];
      if (!names) continue;
      const args = names
        .filter((name, index) => attributes[name] !== undefined || index < names.length - 1)
        .map((name) => compileStaticValue(attributes[name] ?? 'false'));
      const method = command.tagName[0].toLowerCase() + command.tagName.slice(1);
      lines.push(`${indent}${variable}.${method}(${args.join(', ')});`);
    }
  }
}

function isConstructorAttribute(name: string, componentName?: string): boolean {
  if (name === 'id' || name === 'style' || name === 'if' || name === 'layout' || name === 'prop.layout') return false;
  if (getTextStyleProperty(name, componentName)) return false;
  if (name.startsWith('on')) return false;
  if (name.startsWith('signal.')) return false;
  if (name.startsWith('layout.') || name.startsWith('set.')) return false;
  if (LAYOUT_ATTRIBUTES.has(name)) return false;
  return true;
}

function compileValue(node: MarkupNode, source: CompiledValueSource): string {
  const value = node.attributes[source.attribute];
  const fallback = source.default === undefined ? 'undefined' : JSON.stringify(source.default);
  if (value === undefined) return fallback;
  switch (source.transform ?? 'evaluate') {
    case 'action': return `this[${JSON.stringify(value)}].bind(this)`;
    default: return compileStaticValue(value);
  }
}

function emitAttributes(
  lines: string[],
  target: string,
  attributes: Record<string, string>,
  includeReference: boolean,
  skipConstructorAssignments: boolean,
  componentName?: string,
): void {
  const layoutEntries: string[] = [];
  let layoutValue: string | undefined;
  for (const [name, value] of Object.entries(attributes)) {
    if (name === 'id') {
      if (includeReference) {
        const key = JSON.stringify(value);
        lines.push(
          `  refs[${key}] = ${target};`,
          `  target[${key}] = ${target};`,
        );
      }
      continue;
    }
    if (name === 'layout') {
      layoutValue = compileStaticValue(value);
      continue;
    }
    if (name === 'anchor' && supportsAnchor(componentName)) {
      if (!skipConstructorAssignments) lines.push(`  ${target}.anchor = ${compileAnchorValue(value)};`);
      continue;
    }
    const textStyleProperty = getTextStyleProperty(name, componentName);
    if (textStyleProperty) {
      lines.push(`  ${target}.style[${JSON.stringify(textStyleProperty)}] = ${compileTextStyleValue(value, TEXT_STYLE_PROPERTIES[textStyleProperty])};`);
      continue;
    }
    if (skipConstructorAssignments && isConstructorAttribute(name, componentName)) continue;
    if (name === 'style') {
      throw new Error('Named runtime styles are not available in native mode; use prop.style or code-behind.');
    }
    if (name === 'if') {
      lines.push(`  ${target}.visible = Boolean(${compileStaticValue(value)});`);
    } else if (name === 'text') {
      lines.push(`  ${target}.text = ${compileStaticValue(value)};`);
    } else if (name.startsWith('prop.')) {
      const compiledValue = compileStaticValue(value);
      lines.push(`  ${target}[${JSON.stringify(name.slice(5))}] = ${compiledValue};`);
    } else if (name.startsWith('set.')) {
      lines.push(`  ${target}[${JSON.stringify(name.slice(4))}] = ${compileStaticValue(value)};`);
    } else if (name.startsWith('signal.') && name.length > 7) {
      const signalName = name.slice(7);
      lines.push(`  ${target}[${JSON.stringify(signalName)}].connect(target[${JSON.stringify(value)}].bind(target));`);
    } else if (name.startsWith('on') && name.length > 2) {
      const eventName = name.slice(2).toLowerCase();
      lines.push(`  ${target}.on(${JSON.stringify(eventName)}, target[${JSON.stringify(value)}], target);`);
    } else if (name.startsWith('layout.')) {
      layoutEntries.push(`${JSON.stringify(name.slice(7))}: ${compileStaticValue(value)}`);
    } else if (LAYOUT_ATTRIBUTES.has(name)) {
      layoutEntries.push(`${JSON.stringify(name)}: ${compileStaticValue(value)}`);
    } else {
      lines.push(`  ${target}[${JSON.stringify(name)}] = ${compileStaticValue(value)};`);
    }
  }
  if (layoutEntries.length > 0) {
    if (componentName && PIXI_UI_COMPONENTS.has(componentName)
      && layoutEntries.some((entry) => entry.startsWith('"width":') || entry.startsWith('"height":'))
      && !layoutEntries.some((entry) => entry.startsWith('"applySizeDirectly":'))) {
      layoutEntries.push('"applySizeDirectly": true');
    }
    if (layoutValue === 'true') {
      if (!layoutEntries.some((entry) => entry.startsWith('"width":'))) layoutEntries.unshift('"width": "intrinsic"');
      if (!layoutEntries.some((entry) => entry.startsWith('"height":'))) layoutEntries.unshift('"height": "intrinsic"');
    }
    lines.push(`  ${target}.layout = { ${layoutEntries.join(', ')} };`);
  } else if (layoutValue !== undefined) {
    lines.push(`  ${target}.layout = ${layoutValue};`);
  }
}

function validateLayoutSemantics(root: MarkupNode, source: string, options: CompileMarkupOptions): void {
  const visit = (node: MarkupNode): void => {
    const attributes = node.attributes;
    const layoutValue = attributes.layout;
    const layoutEntries = Object.keys(attributes).filter(
      (name) => name.startsWith('layout.') || LAYOUT_ATTRIBUTES.has(name),
    );
    if (layoutValue !== undefined && !['true', 'false', 'null'].includes(layoutValue)) {
      throw createDiagnostic(source, 'layout must be true, false, or null.', options, 'layout', 'INVALID_LAYOUT_VALUE');
    }
    if ((layoutValue === 'false' || layoutValue === 'null') && layoutEntries.length > 0) {
      throw createDiagnostic(source, `layout="${layoutValue}" cannot be combined with layout styles.`, options, 'layout', 'CONFLICTING_LAYOUT_VALUE');
    }
    if (node.tagName === 'LayoutView') {
      const children = node.children.filter((child) => !getPropertyElementName(node, child));
      if (children.length !== 1) {
        throw createDiagnostic(source, 'LayoutView requires exactly one child, compiled as its slot.', options, node.tagName, 'INVALID_LAYOUT_VIEW_SLOT');
      }
    }
    if (LAYOUT_LEAF_COMPONENTS.has(node.tagName) && !isGraphicsTag(node.tagName)) {
      const displayChildren = node.children.filter((child) => !getPropertyElementName(node, child));
      if (displayChildren.length > 0) {
        throw createDiagnostic(source, `${node.tagName} is a leaf node and cannot contain display children.`, options, displayChildren[0].tagName, 'LEAF_CHILD_NOT_ALLOWED');
      }
    }
    const isLeaf = LAYOUT_LEAF_COMPONENTS.has(node.tagName)
      || node.tagName === 'LayoutView'
      || attributes.isLeaf === 'true'
      || attributes['layout.isLeaf'] === 'true';
    for (const rawName of layoutEntries) {
      const name = rawName.startsWith('layout.') ? rawName.slice(7) : rawName;
      if (node.tagName === 'Container' && LAYOUT_CONTAINER_VISUAL_ATTRIBUTES.has(name)) {
        throw createDiagnostic(source, `${name} requires LayoutContainer or LayoutView.`, options, rawName, 'UNSUPPORTED_LAYOUT_STYLE');
      }
      if (LAYOUT_LEAF_ONLY_ATTRIBUTES.has(name) && !isLeaf) {
        throw createDiagnostic(source, `${name} only applies to leaf nodes.`, options, rawName, 'LEAF_LAYOUT_STYLE_REQUIRED');
      }
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
}

function validateReferences(root: MarkupNode): void {
  const names = new Set<string>();
  const visit = (node: MarkupNode): void => {
    const reference = getReferenceName(node);
    if (reference) {
      if (names.has(reference)) throw new Error(`Duplicate UI reference: ${reference}`);
      if (FORBIDDEN_REFERENCE_NAMES.has(reference)) {
        throw new Error(`Reserved UI reference name: ${reference}`);
      }
      names.add(reference);
    }
    for (const child of node.children) visit(child);
  };
  visit(root);
}

function getReferenceName(node: MarkupNode): string | undefined {
  return node.attributes.id;
}

function compileStaticValue(value: string): string {
  const asset = value.match(/^@asset\(([^)]+)\)$/);
  if (asset) return `__MarkupAssets.get(${JSON.stringify(asset[1].trim())})`;
  const binding = value.match(/^\{([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\}$/);
  if (binding) {
    return binding[1]
      .split('.')
      .reduce((expression, member) => `${expression}[${JSON.stringify(member)}]`, 'target');
  }
  if (value.includes('{') || value.includes('}')) {
    throw new Error(
      `Invalid native binding ${JSON.stringify(value)}. Use a single property path such as {width} or {theme.color}.`,
    );
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  if (/^0x[\da-f]+$/i.test(value)) return value;
  if (value === 'true' || value === 'false' || value === 'null') return value;
  return JSON.stringify(decodeMarkupStringEscapes(value));
}

function decodeMarkupStringEscapes(value: string): string {
  return value
    .replace(/\\u\{([\da-fA-F]{1,6})\}/g, (match, codePoint: string) => {
      const numericValue = Number.parseInt(codePoint, 16);
      return numericValue <= 0x10FFFF ? String.fromCodePoint(numericValue) : match;
    })
    .replace(/\\u([\da-fA-F]{4})/g, (_match, codeUnit: string) =>
      String.fromCharCode(Number.parseInt(codeUnit, 16)));
}

function compileAnchorValue(value: string): string {
  if (/^\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\}$/.test(value)) {
    return compileStaticValue(value);
  }
  const parts = value.split(',').map((part) => part.trim());
  if (parts.length === 2) return `{ x: ${parts[0]}, y: ${parts[1]} }`;
  return compileStaticValue(value.trim());
}

function compileTextStyleValue(value: string, type: MarkupValueType): string {
  const deferred = /^\{[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\}$/.test(value)
    || /^@asset\([^)]+\)$/.test(value);
  if (deferred) return compileStaticValue(value);
  if (type === 'string') return JSON.stringify(decodeMarkupStringEscapes(value));
  if (type === 'number|string' && !/^-?\d+(\.\d+)?$/.test(value)) return JSON.stringify(decodeMarkupStringEscapes(value));
  return compileStaticValue(value);
}

function containsAssetReference(root: MarkupNode): boolean {
  if (Object.values(root.attributes).some((value) => /^@asset\([^)]+\)$/.test(value))) return true;
  return root.children.some(containsAssetReference);
}

function convertNode(record: Record<string, unknown>): MarkupNode {
  const tagName = getTagName(record);
  if (!tagName) throw new Error('Invalid XML element.');

  const content = Array.isArray(record[tagName])
    ? (record[tagName] as Array<Record<string, unknown>>)
    : [];
  const rawAttributes = (record[':@'] ?? {}) as Record<string, unknown>;
  const attributes = Object.fromEntries(
    Object.entries(rawAttributes).map(([name, value]) => [name, String(value)]),
  );
  const children = content
    .filter((child) => getTagName(child) !== null)
    .map(convertNode);

  return { tagName, attributes, children };
}

function getTagName(record: Record<string, unknown>): string | null {
  return (
    Object.keys(record).find(
      (key) => key !== ':@' && key !== '#text' && !key.startsWith('?'),
    ) ?? null
  );
}
