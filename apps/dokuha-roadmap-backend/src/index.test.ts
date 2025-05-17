import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("GET / Hello Hono", () => {
	it("should return 200 and 'Hello Hono!'", async () => {
		const response = await SELF.fetch("http://localhost:8787/");
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("Hello Hono");
	});
});
