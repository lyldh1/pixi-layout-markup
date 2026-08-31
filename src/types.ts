import type { Container, ContainerChild } from 'pixi.js';

export interface MarkupNode {
  tagName: string;
  attributes: Record<string, string>;
  children: MarkupNode[];
}

export type MarkupTemplate = (
  target: Container,
  refs: Record<string, ContainerChild>,
) => void;
