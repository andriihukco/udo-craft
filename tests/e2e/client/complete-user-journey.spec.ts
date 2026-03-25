import { test, expect } from '@playwright/test';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

test.describe('Client App - Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CLIENT_URL);
  });

  test('home page loads with navigation and products', async ({ page }) => {
    // Check navigation
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=U:DO')).toBeVisible();

    // Check hero section
    await expect(page.locator('h1:has-text("Ми створюємо одяг")')).toBeVisible();

    // Wait for products to load
    await expect(page.locator('[id="collections"]')).toBeVisible();

    // Check product cards
    const productCards = page.locator('[id="collections"] a').first();
    await expect(productCards).toBeVisible();
  });

  test('product customization flow', async ({ page }) => {
    // Navigate to products
    await page.click('[id="collections"]');

    // Wait for products to load
    await page.waitForSelector('a[href*="customize"]');

    // Click first product to customize
    const customizeLinks = page.locator('a[href*="customize"]');
    await customizeLinks.first().click();

    // Check customization page
    await expect(page.locator('h1:has-text("Кастомізація")')).toBeVisible();

    // Select size
    await page.click('button:has-text("M")');

    // Select color
    await page.click('button:has-text("Чорний")');

    // Set quantity
    await page.fill('input[type="number"]', '15');

    // Upload logo (skip file upload for test reliability)
    // In real test, you'd handle file upload here

    // Check add to cart button
    await expect(page.locator('button:has-text("Додати в кошик")')).toBeVisible();
  });

  test('contact form submission', async ({ page }) => {
    // Scroll to contact form
    await page.click('[href="#contact"]');

    // Fill contact form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '+380123456789');
    await page.fill('input[name="company"]', 'Test Company');
    await page.fill('textarea[name="message"]', 'I am interested in custom merchandise for my company.');

    // Submit form
    await page.click('button:has-text("Надіслати")');

    // Check success message
    await expect(page.locator('text=Дякуємо за ваше звернення')).toBeVisible();
  });

  test('navigation flow', async ({ page }) => {
    // Test navigation links
    await page.click('a[href="#collections"]');
    await expect(page.locator('[id="collections"]')).toBeVisible();

    await page.click('a[href="#how"]');
    await expect(page.locator('[id="how"]')).toBeVisible();

    await page.click('a[href="#contact"]');
    await expect(page.locator('[id="contact"]')).toBeVisible();
  });

  test('responsive design', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('nav')).toBeVisible();
  });
});
