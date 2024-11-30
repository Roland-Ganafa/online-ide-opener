import { test, expect } from '@playwright/test';

test.describe('IDE Opener Extension', () => {
  test.beforeEach(async ({ context }) => {
    // Load extension
    await context.addInitScript({
      path: './dist/background.js'
    });
  });

  test('should open popup and show IDE list', async ({ page }) => {
    await page.goto('https://github.com');
    
    // Click extension icon
    await page.click('#ide-opener-extension-icon');
    
    // Check if popup opens
    const popup = await page.waitForSelector('.popup-container');
    expect(popup).toBeTruthy();
    
    // Check if IDE list is loaded
    const ideList = await popup.$$('.ide-item');
    expect(ideList.length).toBeGreaterThan(0);
  });

  test('should detect GitHub repository and suggest compatible IDEs', async ({ page }) => {
    await page.goto('https://github.com/test/repo');
    
    // Wait for extension to process page
    await page.waitForTimeout(1000);
    
    // Check badge
    const badge = await page.$('#ide-opener-extension-icon .badge');
    expect(await badge.textContent()).toBe('2'); // GitHub.dev and Gitpod
  });

  test('should open Quick Launch with keyboard shortcut', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Press shortcut
    await page.keyboard.press('Control+Shift+Space');
    
    // Check if Quick Launch opens
    const quickLaunch = await page.waitForSelector('#ide-opener-quick-launch');
    expect(quickLaunch).toBeTruthy();
    
    // Type in search
    await page.type('#ide-opener-quick-launch input', 'vscode');
    
    // Check search results
    const results = await page.$$('.quick-result');
    expect(results.length).toBeGreaterThan(0);
  });

  test('should save and sync workspaces', async ({ page, context }) => {
    // Open two pages
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Save workspace in first page
    await page1.goto('https://github.com/test/repo1');
    await page1.click('#ide-opener-fab');
    await page1.click('[data-action="workspace"]');
    
    // Check if workspace appears in second page
    await page2.goto('chrome://extensions/?options=ide-opener');
    const workspaceList = await page2.waitForSelector('.workspace-list');
    const workspaces = await workspaceList.$$('.workspace-item');
    
    expect(workspaces.length).toBe(1);
    expect(await workspaces[0].textContent()).toContain('test/repo1');
  });

  test('should monitor and report performance issues', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Simulate high memory usage
    await page.evaluate(() => {
      const array = new Array(1000000).fill('test');
      window.keepInMemory = array;
    });
    
    // Wait for performance monitoring cycle
    await page.waitForTimeout(30000);
    
    // Check for notification
    const notification = await page.waitForSelector('.performance-notification');
    expect(notification).toBeTruthy();
    expect(await notification.textContent()).toContain('High memory usage');
  });

  test('should handle collaborative features', async ({ page, context }) => {
    await page.goto('https://github.com/test/repo');
    
    // Open collaboration menu
    await page.click('#ide-opener-fab');
    await page.click('[data-action="share"]');
    
    // Check if link is copied to clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('ide-opener.example.com/share/');
    
    // Open shared link in new page
    const page2 = await context.newPage();
    await page2.goto(clipboardText);
    
    // Check if session is loaded
    const sessionInfo = await page2.waitForSelector('.session-info');
    expect(await sessionInfo.textContent()).toContain('test/repo');
  });
});
