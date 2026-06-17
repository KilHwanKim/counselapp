import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const hasSolapiSecret = Boolean(process.env.SOLAPI_API_SECRET);
const smsDryRun = process.env.SMS_DRY_RUN ?? (hasSolapiSecret ? 'false' : 'true');

export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL,
        headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : {
            command: 'npx next dev --port 3001',
            url: baseURL,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: {
                ...process.env,
                SMS_FROM_NUMBER: process.env.SMS_FROM_NUMBER || '01083449298',
                SMS_DRY_RUN: smsDryRun,
            },
        },
});
