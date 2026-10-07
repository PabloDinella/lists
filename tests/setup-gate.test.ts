import assert from "node:assert/strict";
import test from "node:test";
import { createSetupGate } from "../src/lib/setup-gate.ts";

test("setup runs once for concurrent calls from the same account", async () => {
  const runSetup = createSetupGate<number>();
  let executions = 0;
  let release!: (value: number) => void;
  const work = () => {
    executions++;
    return new Promise<number>((resolve) => { release = resolve; });
  };

  const first = runSetup("account-a", work);
  const second = runSetup("account-a", work);
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(executions, 1);
  release(42);
  assert.deepEqual(await Promise.all([first, second]), [42, 42]);
});

test("failed setup can be retried", async () => {
  const runSetup = createSetupGate<number>();
  await assert.rejects(runSetup("account-a", async () => { throw Error("failed"); }));
  assert.equal(await runSetup("account-a", async () => 7), 7);
});
