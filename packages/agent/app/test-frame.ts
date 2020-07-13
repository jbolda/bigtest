import { Operation, resource } from 'effection';
import { subscribe, Subscription, Subscribable, SymbolSubscribable } from '@effection/subscription';
import { on } from '@effection/events';
import { bigtestGlobals } from '@bigtest/globals';
import { once } from '@effection/events';
import { ParentMessage, ChildMessage } from './harness-protocol';


export const TestFrame = {
  get element(): HTMLIFrameElement {
    return document.getElementById('test-frame') as HTMLIFrameElement;
  },

  send(message: ChildMessage) {
    if(this.element.contentWindow) {
      this.element.contentWindow.postMessage(message, '*');
    }
  },

  *[SymbolSubscribable](): Operation<Subscription<ParentMessage, void>> {
    return yield subscribe(Subscribable.from(on(window, 'message')).map(([m]) => {
      return JSON.parse((m as { data: string }).data);
    }));
  },

  *load(url: string): Operation {
    this.element.src = url;
    yield once(this.element, 'load');
  },

  *clear(): Operation<void> {
    this.element.src = 'about:blank';
    yield once(this.element, 'load');
  }
}
