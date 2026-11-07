import { expect, it } from "vitest";
import { centralCaPath } from "../../scripts/with-central-ca";

it("uses the sibling public CA by default and preserves an explicit override", () => {
  expect(centralCaPath({}, "/workspace/book-bidding")).toBe(
    "/workspace/book-auth-middleware/central-identity-root.crt",
  );
  expect(centralCaPath({ NODE_EXTRA_CA_CERTS: "./custom-ca.crt" }, "/workspace/book-bidding")).toBe(
    "/workspace/book-bidding/custom-ca.crt",
  );
});
