import { spawn } from 'effection';
import { subscribe, ChainableSubscription } from '@effection/subscription';
import { bigtestGlobals } from '@bigtest/globals';

import { timebox } from './timebox';
import { Agent } from '../shared/agent';
import { TestImplementation, Step, Assertion, ErrorDetails, Context as TestContext } from '@bigtest/suite';
import { Operation, fork } from 'effection';
import { ConsoleMessage } from './harness-protocol';
import { TestFrame } from './test-frame';
import { ParentMessage } from './harness-protocol';

const serializeError: (error: ErrorDetails) => ErrorDetails = ({ message, fileName, lineNumber, columnNumber, stack }) => ({
  message,
  fileName,
  lineNumber,
  columnNumber,
  stack
});

export function *runLane(testRunId: string, agent: Agent, test: TestImplementation, path: string[]): Operation<void> {
  let context: TestContext = {};
  let consoleMessages: ConsoleMessage[] = [];

  yield spawn(function*() {
    let subscription: ChainableSubscription<ParentMessage, undefined> = yield subscribe(TestFrame);

    yield subscription.forEach(function*(message) {
      if(message.type === 'console') {
        consoleMessages.push(message);
      }
    });
  });

  function *runLaneSegment(test: TestImplementation, remainingPath: string[], prefix: string[]): Operation<void> {
    let currentPath = prefix.concat(test.description);

    console.debug('[agent] running test', currentPath);
    agent.send({ testRunId, type: 'test:running', path: currentPath })

    for(let step of test.steps) {
      yield runStep(step, currentPath);
    }

    yield function*() {
      for(let assertion of test.assertions) {
        yield fork(runAssertion(assertion, currentPath));
      }
    }

    if (remainingPath.length > 0) {
      for (let child of test.children) {
        if (child.description === remainingPath[0]) {
          yield runLaneSegment(child, remainingPath.slice(1), currentPath);
        }
      }
    }
  }

  function *runStep(step: Step, prefix: string[]) {
    let stepPath = prefix.concat(step.description);
    bigtestGlobals.runnerState = 'step';
    bigtestGlobals.runnerPath = stepPath;
    try {
      console.debug('[agent] running step', step);
      agent.send({ testRunId, type: 'step:running', path: stepPath });

      let result: TestContext | void = yield timebox(step.action(context), 2000)

      if (result != null) {
        context = {...context, ...result};
      }
      agent.send({ testRunId, type: 'step:result', status: 'ok', path: stepPath });
    } catch(error) {
      console.error('[agent] step failed', step, error);
      if (error.name === 'TimeoutError') {
        agent.send({
          testRunId,
          type: 'step:result',
          status: 'failed',
          timeout: true,
          path: stepPath
        })
      } else {
        agent.send({
          testRunId,
          type: 'step:result',
          status: 'failed',
          timeout: false,
          error: serializeError(error),
          path: stepPath
        });
      }
      return;
    }
  }

  function *runAssertion(assertion: Assertion, prefix: string[]) {
    let assertionPath = prefix.concat(assertion.description);
    bigtestGlobals.runnerState = 'assertion';
    bigtestGlobals.runnerPath = assertionPath;
    try {
      console.debug('[agent] running assertion', assertion);
      agent.send({ testRunId, type: 'assertion:running', path: assertionPath });

      yield timebox(assertion.check(context), 2000)

      agent.send({ testRunId, type: 'assertion:result', status: 'ok', path: assertionPath });
    } catch(error) {
      console.error('[agent] assertion failed', assertion, error);
      agent.send({ testRunId, type: 'assertion:result', status: 'failed', error: serializeError(error), path: assertionPath });
    }
  }

  bigtestGlobals.runnerState = 'waiting';
  let result = yield runLaneSegment(test, path.slice(1), []);
  bigtestGlobals.runnerState = 'waiting';

  return result;
}
