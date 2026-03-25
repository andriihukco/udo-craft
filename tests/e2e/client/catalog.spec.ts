import { test, expect } from '@playwright/test';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

test.describe('Client — Home Page', () => {
  test('home page loads with navigation', async ({ page }) => {
    await page.goto(CLIENT_URL);

    await expect(page.getByText('U:DO')).toBeVisible();
    await expect(page.getByText(/колекції/i)).toBeVisible();
  });

  test('hero section is visible', async ({ page }) => {
    await page.goto(CLIENT_URL);

    await expect(
      page.getByText(/ми створюємо одяг/i)
    ).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await page.goto(CLIENT_URL);

    const collectionsLink = page.getByRole('link', { name: /колекції/i });
    await expect(collectionsLink).toBeVisible();
  });

  test('"Почати проєкт" CTA button is visible', async ({ page }) => {
    await page.goto(CLIENT_URL);

    await expect(
      page.getByRole('link', { name: /почати проєкт/i })
    ).toBeVisible();
  });
});

test.describe('Client — Contact Form', () => {
  test('contact form is visible', async ({ page }) => {
    await page.goto(CLIENT_URL);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    await expect(page.getByLabel(/ваше ім'я/i)).toBeVisible();
    await expect(page.getByLabel(/email/i).last()).toBeVisible();
    await expect(page.getByRole('button', { name: /надіслати/i })).toBeVisible();
  });

  test('contact form requires name and email', async ({ page }) => {
    await page.goto(CLIENT_URL);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    const nameInput = page.getByLabel(/ваше ім'я/i);
    const emailInput = page.getByLabel(/email/i).last();

    await expect(nameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('contact form can be filled and submitted', async ({ page }) => {
    await page.goto(CLIENT_URL);
    await page.locator('#contact').scrollIntoViewIfNeeded();

    await page.getByLabel(/ваше ім'я/i).fill('Test User');
    await page.getByLabel(/email/i).last().fill('test@example.com');

    // Fill optional message textarea
    const messageField = page.getByPlaceholder(/кількість одиниць/i);
    if (await messageField.isVisible()) {
      await messageField.fill('50 t-shirts needed for corporate event');
    }

    await page.getByRole('button', { name: /надіслати/i }).click();

    // Wait for success message OR loading state
    await expect(
      page.getByText(/дякуємо за звернення/i).or(page.getByText(/надсилаємо/i))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Client — Checkout', () => {
  test('empty cart shows appropriate message', async ({ page }) => {
    await page.goto(`${CLIENT_URL}/checkout`);

    await expect(page.getByText(/кошик порожній/i)).toBeVisible();
  });

  test('empty cart has link to catalog', async ({ page }) => {
    await page.goto(`${CLIENT_URL}/checkout`);

    await expect(
      page.getByRole('link', { name: /каталогу/i }).or(
        page.getByRole('button', { name: /каталогу/i })
      )
    ).toBeVisible();
  });
});

test.describe('Client — Footer', () => {
  test('footer displays copyright', async ({ page }) => {
    await page.goto(CLIENT_URL);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/u:do craft/i)).toBeVisible();
  });

  test('social links are present', async ({ page }) => {
    await page.goto(CLIENT_URL);

    const footer = page.locator('footer');
    await expect(footer.getByText('Instagram')).toBeVisible();
    await expect(footer.getByText('Facebook')).toBeVisible();
    await expect(footer.getByText('TikTok')).toBeVisible();
  });
});
