import './globals';
import { TestImplementation } from '@bigtest/suite';

export type RunnerState = 'idle' | 'waiting' | 'step' | 'assertion';

interface BigtestOptions {
  testFrame?: HTMLIFrameElement;
  document?: Document;
  defaultInteractorTimeout?: number;
  appUrl?: string;
  runnerState?: RunnerState;
  runnerPath?: string[];
}

const defaultManifest: TestImplementation = {
  description: 'Empty',
  steps: [],
  assertions: [],
  children: [],
};

function options(): BigtestOptions {
  if(!globalThis.__bigtest) {
    globalThis.__bigtest = {};
  }
  return globalThis.__bigtest as BigtestOptions;
}

export const bigtestGlobals = {
  manifestProperty: '__bigtestManifest',

  get manifest(): TestImplementation {
    return globalThis.__bigtestManifest as TestImplementation || defaultManifest;
  },

  set manifest(value: TestImplementation) {
    globalThis.__bigtestManifest = value;
  },

  get document(): Document {
    let testFrame = options().testFrame;
    let doc = options().document || (testFrame && testFrame.contentDocument) || globalThis.document;
    if(!doc) { throw new Error('no document found') };
    return doc;
  },

  set document(value: Document) {
    options().document = value;
  },

  get defaultInteractorTimeout(): number {
    return options().defaultInteractorTimeout || 1900;
  },

  set defaultInteractorTimeout(value: number) {
    options().defaultInteractorTimeout = value;
  },

  get testFrame(): HTMLIFrameElement | undefined {
    return options().testFrame;
  },

  set testFrame(value: HTMLIFrameElement | undefined) {
    options().testFrame = value;
  },

  get appUrl(): string | undefined {
    return options().appUrl;
  },

  set appUrl(value: string | undefined) {
    options().appUrl = value;
  },

  get runnerState(): RunnerState {
    return options().runnerState || 'idle';
  },

  set runnerState(value: RunnerState) {
    options().runnerState = value;
  },

  get runnerPath(): string[] | undefined {
    return options().runnerPath;
  },

  set runnerPath(value: string[] | undefined) {
    options().runnerPath = value;
  },

  reset() {
    delete globalThis.__bigtest;
    delete globalThis.__bigtestManifest;
  }
};
