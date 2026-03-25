import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';

test.describe('Admin Login Flow', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);

    await expect(page.getByText('U:DO Craft')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Пароль')).toBeVisible();
    await expect(page.getByRole('button', { name: /увійти/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);

    await page.getByLabel('Email').fill('wrong@email.com');
    await page.getByLabel('Пароль').fill('wrongpassword');
    await page.getByRole('button', { name: /увійти/i }).click();

    await expect(
      page.getByText(/невірний email або пароль/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('email field requires valid format', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('password field is masked', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);

    const passwordInput = page.getByLabel('Пароль');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Admin Login — Authenticated Flow', () => {
  // These tests require valid credentials set via env vars:
  // TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD
  test.skip(!process.env.TEST_ADMIN_EMAIL, 'Requires TEST_ADMIN_EMAIL env var');

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);

    await page.getByLabel('Email').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.getByLabel('Пароль').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: /увійти/i }).click();

    await expect(page).toHaveURL(ADMIN_URL + '/', { timeout: 15000 });
    await expect(page.getByText(/аналітика/i)).toBeVisible();
  });

  test('authenticated user is redirected from /login to /', async ({ page }) => {
    // Login first
    await page.goto(`${ADMIN_URL}/login`);
    await page.getByLabel('Email').fill(process.env.TEST_ADMIN_EMAIL!);
    await page.getByLabel('Пароль').fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: /увійти/i }).click();
    await expect(page).toHaveURL(ADMIN_URL + '/', { timeout: 15000 });

    // Now try to navigate back to login
    await page.goto(`${ADMIN_URL}/login`);
    await expect(page).toHaveURL(ADMIN_URL + '/');
  });
});
