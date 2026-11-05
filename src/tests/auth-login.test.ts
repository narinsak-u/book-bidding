import { expect, it } from "vitest";
import { load } from "../routes/auth/login/+page.server";

it("keeps a safe protected-page destination for the Central Identity callback", async () => {
	const result = await load({
		locals: {},
		url: new URL("https://bidding.example.test/auth/login?next=%2Fuser%2Fbids%3Fpage%3D2"),
	} as never);

	expect(result).toEqual({ callbackURL: "/user/bids?page=2", error: false, manual: false });
});

it.each([
	"https://attacker.example/steal",
	"//attacker.example/steal",
	"/api/auth/sign-in/email",
	"/auth/login?next=%2Fdashboard",
])("uses the safe dashboard destination for unsafe return target %s", async (next) => {
	const result = await load({
		locals: {},
		url: new URL(`https://bidding.example.test/auth/login?next=${encodeURIComponent(next)}`),
	} as never);

	expect(result).toEqual({ callbackURL: "/dashboard", error: false, manual: false });
});
it("keeps the validated original destination when Central authorization fails", async () => {
	const result = await load({
		locals: {},
		url: new URL("https://bidding.example.test/auth/login?error=central-identity&next=%2Fuser%2Fbids%3Fpage%3D2"),
	} as never);
	expect(result).toEqual({ callbackURL: "/user/bids?page=2", error: true, manual: false });
});

it("does not start Central authorization after local sign-out", async () => {
	const result = await load({
		locals: {},
		url: new URL("https://bidding.example.test/auth/login?manual=1"),
	} as never);
	expect(result).toEqual({ callbackURL: "/dashboard", error: false, manual: true });
});
