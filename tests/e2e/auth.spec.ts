import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  test('should sign up a new user', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill signup form
    await page.fill('input[type="text"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Click sign up button
    await page.click('button:has-text("Sign Up")');
    
    // Should show success message
    await expect(page.locator('text=Account created successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should sign in with valid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to sign in
    await page.click('text=Already have an account? Sign in');
    
    // Use a known test account
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Click sign in button
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to sign in
    await page.click('text=Already have an account? Sign in');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
  });

  test('should protect document routes', async ({ page }) => {
    // Try to access document without auth
    await page.goto('/doc/test123');
    
    // Should redirect to auth page
    await expect(page).toHaveURL('/auth', { timeout: 5000 });
  });
});
