import { describe, it, beforeEach, afterEach } from 'mocha';
import * as expect from 'expect';
import * as process from 'process';
import { promises as fs }  from 'fs';

import { Process } from './helpers/process';
import { World } from './helpers/world';

function run(...args: string[]) {
  return Process.spawn("yarn", ["ts-node", "./src/index.ts", ...args], {});
}

describe('@bigtest/cli', function() {
  this.timeout(process.env.CI ? 120000 : 30000);

  describe('start', () => {
    describe('starting the server', () => {
      let child: Process;

      beforeEach(async () => {
        child = await World.spawn(run('server'));
      });

      afterEach(async () => {
        await World.spawn(child.term());
      });

      it('outputs that the server was started successfully', async () => {
        await World.spawn(child.stdout?.waitFor("[orchestrator] running!"));
      });
    });

    describe('starting the server without a command', () => {
      let child: Process;
      let childApp: Process;

      beforeEach(async () => {
        childApp = await World.spawn(Process.spawn('yarn', ['bigtest-todomvc', '36001'], {}));
        child = await World.spawn(run('server', '--app.url', 'http://localhost:36001', '--no-app.command'));
      });

      afterEach(async () => {
        await World.spawn(child.term());
        await World.spawn(childApp.term());
      });

      it('outputs that the server was started successfully', async () => {
        await World.spawn(child.stdout?.waitFor("[orchestrator] running!"));
      });
    });

    describe('specifying the command via the cli', () => {
      let child: Process;

      beforeEach(async () => {
        child = await World.spawn(run('server', '--app.url', 'http://localhost:36001', '--app.command', '"yarn bigtest-todomvc 36001"'));
      });

      afterEach(async () => {
        await World.spawn(child.term());
      });

      it('outputs that the server was started successfully', async () => {
        await World.spawn(child.stdout?.waitFor("[orchestrator] running!"));
      });
    });
  });

  describe('test', () => {
    describe('running without server', () => {
      let runChild: Process;

      beforeEach(async () => {
        runChild = await World.spawn(run('test'));
        await World.spawn(runChild.join());
      });

      afterEach(async () => {
        await World.spawn(runChild.term());
      });

      it("provides a nice error with advice to start `bigtest server`", () => {
        expect(runChild.stderr?.output).toContain('bigtest server');
      });
    });

    describe('running the suite successfully', () => {
      let startChild: Process;
      let runChild: Process;

      beforeEach(async () => {
        startChild = await World.spawn(run('server'));

        await World.spawn(startChild.stdout?.waitFor("[orchestrator] running!"));

        runChild = await World.spawn(run('test ./test/fixtures/passing.test.ts'));

        await World.spawn(runChild.join());
      });

      afterEach(async () => {
        await World.spawn(startChild.term());
      });

      it('exits successfully', async () => {
        expect(runChild.code).toEqual(0);
        expect(runChild.stdout?.output).toContain("SUCCESS")
      });
    });

    describe('running the suite with failures', () => {
      let startChild: Process;
      let runChild: Process;

      beforeEach(async () => {
        startChild = await World.spawn(run('server'));

        await World.spawn(startChild.stdout?.waitFor("[orchestrator] running!"));

        runChild = await World.spawn(run('test ./test/fixtures/failing.test.ts'));

        await World.spawn(runChild.join());
      });

      afterEach(async () => {
        await World.spawn(startChild.term());
      });

      it('exits with error code', async () => {
        expect(runChild.code).toEqual(1);
        expect(runChild.stdout?.output).toContain("FAILURE")
      });
    });

    describe('running the suite with build errors', () => {
      let startChild: Process;
      let runChild: Process;

      beforeEach(async () => {
        startChild = await World.spawn(run('server', '--test-files', './test/fixtures/bad.broken.ts'));

        await World.spawn(startChild.stdout?.waitFor("[orchestrator] running!"));

        runChild = await World.spawn(run('test'));

        await World.spawn(runChild.join());
      });

      afterEach(async () => {
        await World.spawn(startChild.close());
      });

      it('exits with error code', async () => {
        expect(runChild.code).toEqual(1);
        expect(runChild.stdout?.output).toContain('Cannot run tests due to build errors in the test suite')
        expect(runChild.stdout?.output).toContain('test/fixtures/bad.broken.ts')
        expect(runChild.stdout?.output).toContain('⨯ FAILURE')
      });
    });
  });

  describe('ci', () => {
    describe('running the suite successfully', () => {
      let child: Process;

      beforeEach(async () => {
        child = await World.spawn(run('ci', './test/fixtures/passing.test.ts'));
        await World.spawn(child.stdout?.waitFor("[orchestrator] running!"));
        await World.spawn(child.join());
      });

      afterEach(async () => {
        await World.spawn(child.term());
      });

      it('exits successfully', async () => {
        expect(child.code).toEqual(0);
        expect(child.stdout?.output).toContain("✓ SUCCESS")
      });
    });

    describe('running the suite with failures', () => {
      let child: Process;

      beforeEach(async () => {
        child = await World.spawn(run('ci', './test/fixtures/failing.test.ts'));
        await World.spawn(child.stdout?.waitFor("[orchestrator] running!"));
        await World.spawn(child.join());
      });

      afterEach(async () => {
        await World.spawn(child.term());
      });

      it('exits with error code', async () => {
        expect(child.code).toEqual(1);
        expect(child.stdout?.output).toContain("test/fixtures/failing.test.ts:15")
        expect(child.stdout?.output).toContain("⨯ FAILURE")
      });

      it('prints the error tree', async () => {
        expect(child.stdout?.output).toContain('☲ Failing Test');
        expect(child.stdout?.output).toContain('↪ first step');
        expect(child.stdout?.output).toContain('↪ second step');
        expect(child.stdout?.output).toContain('↪ third step');
        expect(child.stdout?.output).toContain('✓ check the thing');
        expect(child.stdout?.output).toContain('⨯ child second step');
      });
    });

    describe('running the suite with build errors', () => {
      let child: Process;

      beforeEach(async () => {
        child = await World.spawn(run('ci', '--test-files', './test/fixtures/bad.broken.ts'));
        await World.spawn(child.stdout?.waitFor('[orchestrator] running!'));
        await World.spawn(child.join());
      });

      afterEach(async () => {
        await World.spawn(child.close());
      });

      it('exits with error code', async () => {
        expect(child.code).toEqual(1);
        expect(child.stdout?.output).toContain('Cannot run tests due to build errors in the test suite')
        expect(child.stdout?.output).toContain('test/fixtures/bad.broken.ts')
        expect(child.stdout?.output).toContain('⨯ FAILURE')
      });
    });
  });

  describe('coverage', () => {
    beforeEach( async() => {
      await fs.rmdir('./tmp/coverage', { recursive: true });
    });

    describe('when coverage output is requested', () => {
      let child: Process;
      beforeEach(async () => {
        child = await World.spawn(run('ci', '--coverage', './test/fixtures/coverage.test.ts'));
        await World.spawn(child.join());
      });

      it('outputs the coverage reports', async () => {
        await expect((fs.access('tmp/coverage/lcov/lcov.info'))).resolves.toBeUndefined();
        expect(child.stdout?.output).toContain('reported to -> ./tmp/coverage');
      });
    });

    describe('when requested, but there is no coverage data in the test run', () => {
      let child: Process;
      beforeEach(async () => {
        child = await World.spawn(run('ci', '--coverage', './test/fixtures/passing.test.ts'));
        await World.spawn(child.join());
      });

      it('warns the user that there is no coverage data', () => {
        expect(child.stderr?.output).toContain('no coverage metrics were present');
      });
    });

    describe('when coverage data is present, but coverage output is not requested', () => {
      let child: Process;
      beforeEach(async () => {
        child = await World.spawn(run('ci', './test/fixtures/coverage.test.ts'));
        await World.spawn(child.join());
      });

      it('does nothing', async () => {
        expect(child.stdout?.output).not.toContain('@bigtest/coverage');
        await expect((fs.access('tmp/coverage/lcov/lcov.info'))).rejects.toMatchObject({
          message: expect.stringContaining('no such file or directory')
        });
      });
    });
  });
});
