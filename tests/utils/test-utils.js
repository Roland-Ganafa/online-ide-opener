import { test as base } from '@playwright/test';

export const test = base.extend({
  // Custom fixture to load the extension
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage: () => {},
          onMessage: {
            addListener: () => {}
          }
        },
        storage: {
          sync: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve()
          }
        }
      };
    });
    await use(context);
  },
  
  // Custom fixture for extension-specific actions
  extensionPage: async ({ page }, use) => {
    // Helper functions for extension testing
    const helpers = {
      // Open extension popup
      openPopup: async () => {
        await page.goto('popup.html');
      },
      
      // Open options page
      openOptions: async () => {
        await page.goto('options.html');
      },
      
      // Simulate opening a repository
      openRepository: async (url) => {
        await page.evaluate((repoUrl) => {
          window.postMessage({ type: 'OPEN_REPOSITORY', url: repoUrl }, '*');
        }, url);
      },
      
      // Get current IDE selection
      getCurrentIDE: async () => {
        return await page.evaluate(() => {
          return new Promise((resolve) => {
            chrome.storage.sync.get(['preferredIDE'], (result) => {
              resolve(result.preferredIDE);
            });
          });
        });
      }
    };
    
    await use(helpers);
  }
});
