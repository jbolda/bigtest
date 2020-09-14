import { beforeEach, afterEach } from 'mocha';
import { main, Context, Controls } from 'effection';

export let World: Context & Controls;

beforeEach(() => {
  World = main(undefined) as Context & Controls;
});

afterEach(() => {
  if(World['state'] === "errored") {
    console.error(World.result);
  }
  World.halt();
  // @ts-ignore
  process._getActiveHandles().forEach((handle) => {
    try {
    handle.stdout.end()
    handle.stderr.end()
    } catch (e) {
      // no-op
    }
  });
})
