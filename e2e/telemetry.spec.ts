import { test, expect } from "@playwright/test";

test("telemetry happy path: navigate to telemetry scope and return", async ({ page }) => {
	await page.goto("/");

	// Find the Telemetry link and click it
	const link = page.locator('a[href="/telemetry"]');
	await expect(link).toBeVisible();
	await link.click();

	// Verify URL changed to /telemetry
	await expect(page).toHaveURL(/\/telemetry$/);

	// Verify heading and content are visible
	const heading = page.getByRole("heading", { name: "CORE.OSCILLON" });
	await expect(heading).toBeVisible();

	const subHeading = page.getByText("SRE Telemetry Center");
	await expect(subHeading).toBeVisible();

	const liveTrace = page.getByText("Live trace");
	await expect(liveTrace).toBeVisible();

	// Click return button
	const returnBtn = page.getByRole("link", { name: "Return Base" });
	await expect(returnBtn).toBeVisible();
	await returnBtn.click();

	// Verify URL changed back to homepage /
	await expect(page).toHaveURL(/\/$/);
});
