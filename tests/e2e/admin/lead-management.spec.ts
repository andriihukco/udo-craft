import { test, expect } from '@playwright/test';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';

test.describe('Admin App - Lead Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
  });

  test('admin login flow', async ({ page }) => {
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Увійти")')).toBeVisible();
  });

  test('dashboard loads with metrics', async ({ page }) => {
    // Skip login for test - go directly to dashboard
    await page.goto(`${ADMIN_URL}/`);
    
    // Check dashboard elements
    await expect(page.locator('h1:has-text("Головна")')).toBeVisible();
    
    // Wait for metrics to load
    await page.waitForSelector('[data-testid="metric-card"]');
    
    // Check key metrics
    await expect(page.locator('text=Загальний дохід')).toBeVisible();
    await expect(page.locator('text=Усі замовлення')).toBeVisible();
    await expect(page.locator('text=Клієнти')).toBeVisible();
  });

  test('lead status management', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/clients`);
    
    // Check clients page
    await expect(page.locator('h1:has-text("Клієнти")')).toBeVisible();
    
    // Wait for leads to load
    await page.waitForSelector('[data-testid="lead-row"]');
    
    // Check status filters
    await expect(page.locator('button:has-text("Нові")')).toBeVisible();
    await expect(page.locator('button:has-text("В роботі")')).toBeVisible();
    await expect(page.locator('button:has-text("Виробництво")')).toBeVisible();
    await expect(page.locator('button:has-text("Завершені")')).toBeVisible();
    
    // Click on a lead to view details
    const firstLead = page.locator('[data-testid="lead-row"]').first();
    await firstLead.click();
    
    // Check lead details modal/page
    await expect(page.locator('text=Деталі клієнта')).toBeVisible();
  });

  test('product management', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/products`);
    
    // Check products page
    await expect(page.locator('h1:has-text("Продукти")')).toBeVisible();
    
    // Check for add product button
    await expect(page.locator('button:has-text("Додати продукт")')).toBeVisible();
    
    // Check product list
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Click on a product to edit
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Check product edit form
    await expect(page.locator('text=Редагування продукту')).toBeVisible();
  });

  test('order management', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/orders`);
    
    // Check orders page
    await expect(page.locator('h1:has-text("Замовлення")')).toBeVisible();
    
    // Wait for orders to load
    await page.waitForSelector('[data-testid="order-row"]');
    
    // Check order status indicators
    await expect(page.locator('[data-testid="status-badge"]')).toBeVisible();
    
    // Click on an order to view details
    const firstOrder = page.locator('[data-testid="order-row"]').first();
    await firstOrder.click();
    
    // Check order details
    await expect(page.locator('text=Деталі замовлення')).toBeVisible();
  });

  test('analytics dashboard', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/analytics`);
    
    // Check analytics page
    await expect(page.locator('h1:has-text("Аналітика")')).toBeVisible();
    
    // Wait for charts to load
    await page.waitForSelector('[data-testid="analytics-chart"]');
    
    // Check date range selector
    await expect(page.locator('button:has-text("Останні 7 днів")')).toBeVisible();
    
    // Check metric cards
    await expect(page.locator('[data-testid="analytics-metric"]')).toBeVisible();
  });

  test('data refresh functionality', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/`);
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="metric-card"]');
    
    // Click refresh button
    await page.click('button:has-text("Оновити")');
    
    // Check loading state
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for refresh to complete
    await page.waitForSelector('[data-testid="metric-card"]:not(.loading)');
  });

  test('responsive admin interface', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/`);
    
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
