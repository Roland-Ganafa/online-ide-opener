import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' }
    }
  ],
  webServer: {
    command: 'npm run build',
    port: 8080,
    reuseExistingServer: !process.env.CI
  }
});
