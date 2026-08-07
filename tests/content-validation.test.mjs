import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeUrl } from "../scripts/content-utils.mjs";

test("canonical URLs remove tracking and trailing slashes", () => {
  assert.equal(canonicalizeUrl("https://WWW.Example.com/path/?utm_source=newsletter&ref=home#section"), "https://example.com/path");
});

test("canonical URLs preserve meaningful query parameters in stable order", () => {
  assert.equal(canonicalizeUrl("https://youtube.com/watch?t=30&v=abc123"), "https://youtube.com/watch?t=30&v=abc123");
});
