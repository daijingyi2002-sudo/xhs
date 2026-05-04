import { describe, expect, it } from "vitest";
import { mergeAuthHeaders } from "./api-auth-fetch";

describe("authenticated API fetch helpers", () => {
  it("keeps existing headers and adds the bearer token", () => {
    expect(
      mergeAuthHeaders(
        {
          "Content-Type": "application/json"
        },
        "token-123"
      )
    ).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token-123"
    });
  });

  it("does not add an authorization header when token is missing", () => {
    expect(mergeAuthHeaders({ Accept: "application/json" }, null)).toEqual({
      Accept: "application/json"
    });
  });
});
