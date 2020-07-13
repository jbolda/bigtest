import 'regenerator-runtime/runtime';
import { main } from 'effection';
import { ParentFrame } from './parent-frame';
import { Level } from './harness-protocol';

main(function*() {
  console.log('[harness] starting');

  let parentFrame = yield ParentFrame.start();

  while(true) {
    let message = yield parentFrame.receive();
    console.info('[harness] got message', message);
  }
}).catch(error => console.error(error));


// proxy fetch and XMLHttpRequest requests through the parent frame
if(window.parent !== window) {
  window.fetch = (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    return window.parent.window.fetch(input, init);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).XMLHttpRequest = () => new window.parent.window.XMLHttpRequest();
}

function wrapConsole(level: Level) {
  let original = console[level];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console[level] = (message?: any, ...optionalParams: any[]) => {
    ParentFrame.send({ type: 'console', level: level, message: [message, ...optionalParams].join(' ') });
    original.call(console, message, ...optionalParams);
  };
}

for(let level of ['log', 'info', 'debug', 'warn', 'error'] as Level[]) {
  wrapConsole(level);
}
