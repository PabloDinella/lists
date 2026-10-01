import assert from "node:assert/strict";
import test from "node:test";
import { parseCaptureText } from "../supabase/functions/_shared/capture-text.ts";

test("keeps text beyond the title limit", () => {
  const message = "A".repeat(500) + "B".repeat(100);
  assert.deepEqual(parseCaptureText(message), {
    title: "A".repeat(500),
    content: "B".repeat(100),
  });
});

test("uses the first line as the title and remaining lines as content", () => {
  assert.deepEqual(parseCaptureText("Buy milk\nAt the corner shop"), {
    title: "Buy milk",
    content: "At the corner shop",
  });
});
