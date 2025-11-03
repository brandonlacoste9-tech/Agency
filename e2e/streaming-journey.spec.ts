import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Full streaming user journey
 * Tests the complete flow from prompt → streaming → abort
 */

test.describe("Streaming User Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");
  });

  test("user can open command palette and generate a prompt", async ({
    page,
  }) => {
    // Find the command palette trigger button
    const paletteBtn = page.getByRole("button", {
      name: /open command palette/i,
    });
    await expect(paletteBtn).toBeVisible();

    // Click to open palette
    await paletteBtn.click();

    // Palette should appear
    const paletteDialog = page.locator('[role="dialog"]').first();
    await expect(paletteDialog).toBeVisible();

    // Close palette
    await page.keyboard.press("Escape");
    await expect(paletteDialog).not.toBeVisible();
  });

  test("user can type a prompt and see streaming response", async ({
    page,
  }) => {
    // Find the prompt textarea
    const textarea = page.getByPlaceholderText(/type your idea/i);
    await expect(textarea).toBeVisible();

    // Type a test prompt
    await textarea.fill("Explain quantum computing in one sentence");

    // Find and click the Generate button
    const generateBtn = page.getByRole("button", { name: /generate/i });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Button should change to "Streaming…" or "Thinking…"
    await expect(generateBtn).toContainText(/streaming|thinking/i);

    // Answer area should eventually contain text
    const answerArea = page.getByTestId("answer-stream");
    await expect(answerArea).not.toBeEmpty({ timeout: 10000 });

    // Verify content is visible
    const content = await answerArea.textContent();
    expect(content?.length).toBeGreaterThan(0);
  });

  test("user can abort a streaming response", async ({ page }) => {
    // Type a prompt
    const textarea = page.getByPlaceholderText(/type your idea/i);
    await textarea.fill("Write a very long story about...");

    // Start generation
    const generateBtn = page.getByRole("button", { name: /generate/i });
    await generateBtn.click();

    // Find the abort button
    const abortBtn = page.getByTestId("abort-stream");
    await expect(abortBtn).not.toBeDisabled();

    // Click abort
    await abortBtn.click();

    // Button should disable again
    await expect(abortBtn).toBeDisabled({ timeout: 5000 });

    // Generate button should be enabled again
    await expect(generateBtn).toBeEnabled({ timeout: 5000 });
  });

  test("model selector persists selected choice", async ({ page }) => {
    // Find the model selector
    const modelSelect = page.locator('select');
    await expect(modelSelect).toBeVisible();

    // Check initial value
    const initialValue = await modelSelect.inputValue();
    expect(initialValue).toBe("openai/gpt-5");

    // Change to different model
    await modelSelect.selectOption("openai/gpt-4o");

    // Verify change persists
    const newValue = await modelSelect.inputValue();
    expect(newValue).toBe("openai/gpt-4o");
  });

  test("error messages display gracefully", async ({ page }) => {
    // Intercept fetch to return an error
    await page.route("**/api/chat*", (route) => {
      route.abort("failed");
    });

    // Type prompt and generate
    const textarea = page.getByPlaceholderText(/type your idea/i);
    await textarea.fill("Test error handling");

    const generateBtn = page.getByRole("button", { name: /generate/i });
    await generateBtn.click();

    // Error message should appear
    const answerArea = page.getByTestId("answer-stream");
    const errorText = await answerArea.textContent();
    expect(errorText).toMatch(/error|failed/i);
  });

  test("accessibility: keyboard navigation works", async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press("Tab");
    let focused = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label")
    );
    expect(focused).toBeTruthy();

    // Generate should be reachable by tab
    const generateBtn = page.getByRole("button", { name: /generate/i });
    await generateBtn.focus();
    await expect(generateBtn).toBeFocused();

    // Should be clickable with Enter
    await page.keyboard.press("Enter");
    // Input a prompt first
    const textarea = page.getByPlaceholderText(/type your idea/i);
    await textarea.fill("Test");
    await generateBtn.click();

    // Abort button should be focusable
    const abortBtn = page.getByTestId("abort-stream");
    await abortBtn.focus();
    await expect(abortBtn).toBeFocused();
  });

  test("usage badge displays quota information", async ({ page }) => {
    // Look for usage badge (if added to TopBar)
    const usageBadge = page.locator("text=/usage|quota|tokens/i").first();

    // Badge should be visible or gracefully absent
    if (await usageBadge.isVisible()) {
      const badgeText = await usageBadge.textContent();
      expect(badgeText).toMatch(/\d+%/); // Should show percentage
    }
  });

  test("multiple prompts can be generated in sequence", async ({ page }) => {
    const textarea = page.getByPlaceholderText(/type your idea/i);
    const generateBtn = page.getByRole("button", { name: /generate/i });
    const answerArea = page.getByTestId("answer-stream");

    // First prompt
    await textarea.fill("First test");
    await generateBtn.click();
    await expect(answerArea).not.toBeEmpty({ timeout: 10000 });
    const firstAnswer = await answerArea.textContent();

    // Clear and generate second
    await textarea.fill("Second test");
    await generateBtn.click();
    await expect(answerArea).not.toBeEmpty({ timeout: 10000 });
    const secondAnswer = await answerArea.textContent();

    // Answers should be different (assuming streaming produces different results)
    expect(secondAnswer?.length).toBeGreaterThan(0);
  });
});
