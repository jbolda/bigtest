import { Context, Operation, main } from 'effection';
import { performance } from 'perf_hooks';

type World = Context & { spawn<T>(operation: Operation<T>): Promise<T> };

let currentWorld: World;

beforeEach(() => {
  currentWorld = main(undefined) as World;
});

afterEach(() => {
  currentWorld.halt();
});

export function spawn<T>(operation: Operation<T>): Promise<T> {
  return currentWorld.spawn(operation);
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function converge<T>(timeout: number, fn: () => T): Promise<T> {
  let startTime = performance.now();

  while (true) {
    try {
      return fn();
    } catch (err) {
      let diff = performance.now() - startTime;
      if (diff > timeout) {
        throw err;
      }
      await wait(1);
    }
  }
}

export async function never(timeout: number, fn: () => void): Promise<void> {
  let startTime = performance.now();
  let passed = false;

  while (true) {
    try {
      fn();
      passed = true;
    } catch (err) {
      let diff = performance.now() - startTime;
      if (diff > timeout) {
        return;
      }
      await wait(1);
    }

    if (passed === true) {
      throw new Error('Assertion passed unexpectedly');
    }
  }
}
