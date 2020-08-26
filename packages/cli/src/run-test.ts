import { Operation } from 'effection';
import { ProjectOptions } from '@bigtest/project';
import { performance } from '@bigtest/performance';
import { ResultStatus } from '@bigtest/suite';
import { Client } from '@bigtest/server';
import { MainError } from '@effection/node';
import * as query from './query';
import { StreamingFormatter } from './format-helpers';

export function* runTest(config: ProjectOptions, formatter: StreamingFormatter): Operation<void> {
  let client: Client = yield Client.create(`ws://localhost:${config.port}`);

  let subscription = yield client.subscription(query.run());
  let stepCounts = { ok: 0, failed: 0, disregarded: 0 };
  let assertionCounts = { ok: 0, failed: 0, disregarded: 0 };
  let testRunStatus: ResultStatus | undefined;

  formatter.header();

  let startTime = performance.now();

  while(true) {
    let result: query.RunResult = yield subscription.receive();
    if(query.isDoneResult(result)) {
      break;
    } else if(result.event) {
      let status = result.event.status;
      if(result.event.type === 'testRun:result') {
        testRunStatus = result.event.status;
      }
      if(result.event.type === 'step:result' && status && status !== 'pending' && status !== 'running') {
        stepCounts[status] += 1;
      }
      if(result.event.type === 'assertion:result' && status && status !== 'pending' && status !== 'running') {
        assertionCounts[status] += 1;
      }
      formatter.event(result.event, config);
    }
  }

  console.log('\n');

  let endTime = performance.now();

  let treeQuery = yield client.query(`
  fragment results on TestResult {  
    description
    status
    steps {
      description
      status
      timeout
      error {
        message
        fileName
        columnNumber
        stack
      }
    }
    assertions {
      description
      status
    }
  }
  
  {
    testRuns {
      agents {
        agent { agentId }
        result {
          ...results
          children {
            ...results
            children {
              ...results
              children {
                ...results
                children {
                  ...results
                  children {
                    ...results
                    children {
                      ...results
                      children {
                        ...results
                        children {
                          ...results
                          children {
                            ...results
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`);

  formatter.ci(treeQuery.testRuns[treeQuery.testRuns.length - 1], config);

  formatter.footer({
    status: testRunStatus || 'failed',
    duration: endTime - startTime,
    stepCounts,
    assertionCounts,
  });

  if(testRunStatus !== 'ok') {
    throw new MainError({ exitCode: 1 });
  }
}
