import { test, expect } from '@playwright/test';

// Helper to create a valid CSV with metadata
function createValidCsvBase64() {
  const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now
  // Generate a 32-character nonce
  const nonce = Array(32).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const csv = `# METADATA - DO NOT EDIT THIS SECTION
# version: 1.0
# signature: mock_signature_for_testing_only
# timestamp: ${new Date().toISOString()}
# session_id: test-session-${Date.now()}
# row_count: 1
# nonce: ${nonce}
# expires_at: ${futureDate}
# END METADATA
ticket_id,subject,priority,category
1,Login issues,High,Authentication
`;
  return btoa(csv);
}

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays initial state correctly', async ({ page }) => {
    // Check title and subtitle
    await expect(page.getByText('AI Ticket Classifier')).toBeVisible();
    await expect(page.getByText('Automated support ticket organization')).toBeVisible();

    // Check generate button
    const generateButton = page.getByRole('button', { name: /generate sample tickets/i });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
  });

  test('shows processing state when generating CSV', async ({ page }) => {
    // First check if the page loaded correctly
    await expect(page.getByText('AI Ticket Classifier')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate sample tickets/i })).toBeVisible();

    // Mock API responses with delay to allow processing state to be visible
    await page.route('**/api/csv/generate', async route => {
      console.log('Mocking /api/csv/generate');
      // Add delay to simulate real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { csv_content: createValidCsvBase64() } })
      });
    });

    await page.route('**/api/tickets/upload', async route => {
      console.log('Mocking /api/tickets/upload');
      // Add delay to simulate real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Click generate button
    const generateButton = page.getByRole('button', { name: /generate sample tickets/i });
    console.log('Clicking generate button');
    await generateButton.click();

    // Check processing state - any progress message should be visible
    await expect(page.getByText(/Initializing AI magic|Consulting the ticket gods|Decoding ancient CSV runes|Teaching AI to classify tickets|AI enlightenment achieved/)).toBeVisible();

    // Check progress bar exists (it may be hidden initially due to CSS transitions)
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeAttached();
  });

  test('completes flow and shows success state', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/csv/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { csv_content: createValidCsvBase64() } })
      });
    });

    await page.route('**/api/tickets/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Start generation
    const generateButton = page.getByRole('button', { name: /generate sample tickets/i });
    await generateButton.click();

    // Wait for completion with longer timeout - use exact match to avoid toast
    await expect(page.locator('p').filter({ hasText: /^Sample dataset ready!$/ })).toBeVisible({ timeout: 10000 });

    // Check buttons
    const openDashboardButton = page.getByRole('button', { name: /open dashboard/i });
    const generateAnotherButton = page.getByRole('button', { name: /generate another/i });

    await expect(openDashboardButton).toBeVisible();
    await expect(generateAnotherButton).toBeVisible();
  });

  test('generate another resets to initial state', async ({ page }) => {
    // Mock API responses
    await page.route('**/api/csv/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { csv_content: createValidCsvBase64() } })
      });
    });

    await page.route('**/api/tickets/upload', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Complete flow
    const generateButton = page.getByRole('button', { name: /generate sample tickets/i });
    await generateButton.click();
    await expect(page.locator('p').filter({ hasText: /^Sample dataset ready!$/ })).toBeVisible({ timeout: 10000 });

    // Click generate another
    const generateAnotherButton = page.getByRole('button', { name: /generate another/i });
    await generateAnotherButton.click();

    // Should be back to initial state
    await expect(page.getByRole('button', { name: /generate sample tickets/i })).toBeVisible();
    await expect(page.locator('p').filter({ hasText: /^Sample dataset ready!$/ })).not.toBeVisible();
  });

  test('footer links are correct', async ({ page }) => {
    const backendLink = page.getByRole('link', { name: /backend api/i });
    const frontendLink = page.getByRole('link', { name: /frontend react/i });

    await expect(backendLink).toHaveAttribute('href', 'https://github.com/leandrodsg/ai-ticket-classifier-api');
    await expect(frontendLink).toHaveAttribute('href', 'https://github.com/leandrodsg/ai-ticket-classifier-web');
  });

  test('is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByText('AI Ticket Classifier')).toBeVisible();
    const generateButton = page.getByRole('button', { name: /generate sample tickets/i });
    await expect(generateButton).toBeVisible();
  });

  test('is responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.getByText('AI Ticket Classifier')).toBeVisible();
    const generateButton = page.getByRole('button', { name: /generate sample tickets/i });
    await expect(generateButton).toBeVisible();
  });

  test('is responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await expect(page.getByText('AI Ticket Classifier')).toBeVisible();
    const generateButton = page.getByRole('button', { name: /generate sample tickets/i });
    await expect(generateButton).toBeVisible();
  });
});