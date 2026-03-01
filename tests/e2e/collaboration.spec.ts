import { test, expect } from '@playwright/test';

test.describe('Real-time Collaboration', () => {
  const testEmail1 = `user1${Date.now()}@example.com`;
  const testEmail2 = `user2${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName1 = 'User One';
  const testName2 = 'User Two';

  test.beforeEach(async ({ page }) => {
    // Create test user
    await page.goto('/auth');
    await page.fill('input[type="text"]', testName1);
    await page.fill('input[type="email"]', testEmail1);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign Up")');
    await page.waitForTimeout(1000);
    
    // Sign in
    await page.click('text=Already have an account? Sign in');
    await page.fill('input[type="email"]', testEmail1);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/');
  });

  test('should create a new document', async ({ page }) => {
    await page.click('button:has-text("Create New Document")');
    
    // Should navigate to document page
    await expect(page).toHaveURL(/\/doc\/[a-zA-Z0-9]+/, { timeout: 5000 });
    
    // Editor should be visible
    await expect(page.locator('.ProseMirror')).toBeVisible();
  });

  test('should join existing document', async ({ page }) => {
    // Create document first
    await page.click('button:has-text("Create New Document")');
    await page.waitForURL(/\/doc\/[a-zA-Z0-9]+/);
    
    // Get document ID from URL
    const url = page.url();
    const docId = url.split('/doc/')[1];
    
    // Go back to home
    await page.goto('/');
    
    // Join the document
    await page.fill('input[placeholder="Enter document ID"]', docId);
    await page.click('button:has-text("Join Document")');
    
    // Should navigate to same document
    await expect(page).toHaveURL(`/doc/${docId}`);
  });

  test('should show typing in editor', async ({ page }) => {
    await page.click('button:has-text("Create New Document")');
    await page.waitForURL(/\/doc\/[a-zA-Z0-9]+/);
    
    // Type in editor
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('Hello, this is a test document!');
    
    // Text should be visible
    await expect(editor).toContainText('Hello, this is a test document!');
  });

  test('should apply rich text formatting', async ({ page }) => {
    await page.click('button:has-text("Create New Document")');
    await page.waitForURL(/\/doc\/[a-zA-Z0-9]+/);
    
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('Bold text');
    
    // Select all text
    await page.keyboard.press('Control+A');
    
    // Click bold button
    await page.click('button:has-text("B")');
    
    // Check if bold is applied
    await expect(editor.locator('strong')).toContainText('Bold text');
  });

  test('should show connected users', async ({ page, context }) => {
    // User 1 creates document
    await page.click('button:has-text("Create New Document")');
    await page.waitForURL(/\/doc\/[a-zA-Z0-9]+/);
    const docId = page.url().split('/doc/')[1];
    
    // Open second browser context for User 2
    const page2 = await context.newPage();
    
    // Sign up User 2
    await page2.goto('/auth');
    await page2.fill('input[type="text"]', testName2);
    await page2.fill('input[type="email"]', testEmail2);
    await page2.fill('input[type="password"]', testPassword);
    await page2.click('button:has-text("Sign Up")');
    await page2.waitForTimeout(1000);
    
    // Sign in User 2
    await page2.click('text=Already have an account? Sign in');
    await page2.fill('input[type="email"]', testEmail2);
    await page2.fill('input[type="password"]', testPassword);
    await page2.click('button:has-text("Sign In")');
    await page2.waitForURL('/');
    
    // User 2 joins document
    await page2.fill('input[placeholder="Enter document ID"]', docId);
    await page2.click('button:has-text("Join Document")');
    await page2.waitForURL(`/doc/${docId}`);
    
    // User 1 should see User 2 in active users
    await expect(page.locator('text=Active users (1)')).toBeVisible({ timeout: 5000 });
    
    await page2.close();
  });

  test('should persist document content', async ({ page }) => {
    await page.click('button:has-text("Create New Document")');
    await page.waitForURL(/\/doc\/[a-zA-Z0-9]+/);
    const docId = page.url().split('/doc/')[1];
    
    // Type content
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('Persistent content test');
    
    // Wait for save
    await page.waitForTimeout(2000);
    
    // Reload page
    await page.reload();
    
    // Content should still be there
    await expect(editor).toContainText('Persistent content test');
  });
});
