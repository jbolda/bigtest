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

  term() {
    if(this.child) {
      try {
        this.kill()
      } catch(e) {
        // do nothing, process is probably already dead
      }
    }
  }

  kill() {
    if(this.child) {
      // Killing all child processes started by this command is surprisingly
      // tricky. If a process spawns another processes and we kill the parent,
      // then the child process is NOT automatically killed. Instead we're using
      // the `detached` option to force the child into its own process group,
      // which all of its children in turn will inherit. By sending the signal to
      // `-pid` rather than `pid`, we are sending it to the entire process group
      // instead. This will send the signal to all processes started by the child
      // process.
      //
      // More information here: https://unix.stackexchange.com/questions/14815/process-descendants

      try {
        process.kill(-this.child.pid, "SIGTERM")
      } catch(e) {
        process.kill(-this.child.pid, "SIGKILL")
      }
      process.stdout.end();
      process.stderr.end();
    }
  }

  *close(t = 2000): Operation<void> {
    let kill = () => this.kill();
    this.term();
    yield spawn(function*(): Operation<void> {
      yield timeout(t);
      kill(); // always try to clean up the process group in case the process left behind some orphans
      throw new Error("unable to shut down child process cleanly");
    });

    yield this.join();
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
