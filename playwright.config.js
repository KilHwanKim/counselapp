import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL,
        headless: true,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : {
            command: 'npx next dev --port 3001',
            url: baseURL,
            reuseExistingServer: true,
            timeout: 120_000,
        },
});
