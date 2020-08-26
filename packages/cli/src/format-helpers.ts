import { ProjectOptions } from '@bigtest/project';
import { ResultStatus } from '@bigtest/suite'
import { RunResultEvent } from './query'

export { ResultStatus } from '@bigtest/suite'
export { RunResultEvent } from './query'
export type Counts = { ok: number; failed: number; disregarded: number };

export type Summary = {
  status: ResultStatus;
  duration: number;
  stepCounts: Counts;
  assertionCounts: Counts;
}

export function icon(event: RunResultEvent) {
  if(event.type.match(/^:running$/)) {
    return "↻";
  } 

  return statusIcon(event.status || '');
}

export function statusIcon(status: string) {
  if(status === 'ok') {
    return "✓";
  } else if(status === 'failed') {
    return "⨯";
  } else if(status === 'disregarded') {
    return "⋯";
  }
}

export type StreamingFormatter = {
  type: "streaming";
  header(): void;
  event(event: RunResultEvent, config: ProjectOptions): void;
  ci(tree: any, config: ProjectOptions): void;
  footer(summary: Summary): void;
}

export type Formatter = StreamingFormatter;
