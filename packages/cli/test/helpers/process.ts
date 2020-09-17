import { resource, spawn, timeout, Operation } from 'effection';
import { ensure, Deferred } from '@bigtest/effection';
import { ChildProcess } from '@effection/node';
import { once } from '@effection/events';

import { Stream } from './stream';

interface ProcessOptions {
  verbose?: boolean;
}

export class Process {
  public stdout?: Stream;
  public stderr?: Stream;
  private child?: ChildProcess.ChildProcess;
  private exited = Deferred<[number,number]>();

  public code?: number;
  public signal?: string;

  static spawn(command: string, args: string[] = [], options: ProcessOptions) {
    let process = new Process(command, args, options);
    return resource(process, process.run());
  }

  constructor(private command: string, private args: string[] = [], private options: ProcessOptions = {}) {}

  *join(): Operation<[number, number]> {
    return yield this.exited.promise;
  }

  *term(): Operation<string> {
    if(this.child) {
      try {
        this.child.kill('SIGTERM')
        return 'SIGTERM signaled'
      } catch(e) {
        // do nothing, process is probably already dead
        return 'error caught in signaling SIGTERM'
      }
    }
    return 'child is dead already'
  }

  *run(): Operation<void> {
    yield ensure(() => this.term());
    this.child = ChildProcess.spawnProcess(this.command, this.args);

    if (this.child?.stdout) {
      this.stdout = yield Stream.of(this.child.stdout, this.options.verbose);
    }
    if (this.child?.stderr) {
      this.stderr = yield Stream.of(this.child.stderr, this.options.verbose);
    }

    let {exitCode, signal} = yield once(this.child, 'exit');

    this.code = exitCode;
    this.signal = signal;

    this.exited.resolve([exitCode, signal]);
  }
}
