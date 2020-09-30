import { resource } from 'effection';
import { on } from '@effection/events';
import { subscribe } from '@effection/subscription';
import { Channel } from '@effection/channel';
import { Readable } from 'stream';

export class Stream {
  public output = "";
  private semaphore = new Channel<true>();

  static *of(value: Readable, verbose = false) {
    let testStream = new Stream(value, verbose);
    return yield resource(testStream, testStream.run());
  }

  constructor(private stream: Readable, private verbose = false) {};

  *run() {
    let events = yield on(this.stream, "data");
    while(true) {
      let { value: chunk } = yield events.next();
      this.output += chunk;
      this.semaphore.send(true);
      if(this.verbose) {
        console.debug(chunk.toString());
      }
    }
  }

  *waitFor(text: string) {
    let subscription = yield subscribe(this.semaphore);
    // TODO fix error swallowing
    // this wait for a specific set of text, and if it throws ts errors
    // then the test just times out and it is hard to track down the real issue
    while(!this.output.includes(text)) {
      yield subscription.next();
    }
  }
}
