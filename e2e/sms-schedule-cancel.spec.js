import { test, expect } from '@playwright/test';

function toDatetimeLocalValue(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-'
        + pad(d.getMonth() + 1) + '-'
        + pad(d.getDate()) + 'T'
        + pad(d.getHours()) + ':'
        + pad(d.getMinutes());
}

test.describe('예약 발송 및 취소', () => {
    test('예약 등록 후 발송 내역에서 예약 취소한다', async ({ page }) => {
        test.setTimeout(120_000);
        page.on('dialog', (dialog) => dialog.accept());

        const uniqueName = 'E2E예약' + Date.now();
        const testBody = 'E2E 예약 테스트 ' + Date.now();

        const createRes = await page.request.post('/api/students', {
            data: {
                name: uniqueName,
                parent_phone: '01077690817',
            },
        });
        expect(createRes.ok()).toBeTruthy();

        await page.goto('/sms/scheduled');
        await expect(page.getByRole('button', { name: '예약 등록' })).toBeVisible();

        const studentsResponsePromise = page.waitForResponse(
            (res) => res.url().includes('/api/students') && res.ok()
        );
        await page.getByRole('button', { name: '학생 선택' }).click();
        await studentsResponsePromise;

        const pickerModal = page.locator('#student-picker-modal');
        await expect(pickerModal).not.toHaveClass(/hidden/, { timeout: 15_000 });
        await page.locator('#student-picker-search').fill(uniqueName);

        const studentRow = pickerModal.locator('.student-picker-item').first();
        await expect(studentRow).toBeVisible({ timeout: 15_000 });
        await studentRow.click();

        await expect(page.locator('#smsStudentName')).toHaveValue(uniqueName);
        await page.locator('#smsBody').fill(testBody);

        const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await page.locator('#smsScheduledAt').fill(toDatetimeLocalValue(scheduledAt.toISOString()));

        const scheduleResponsePromise = page.waitForResponse(
            (res) => res.url().includes('/api/sms/schedule') && res.request().method() === 'POST'
        );
        await page.getByRole('button', { name: '예약 등록' }).click();

        const scheduleResponse = await scheduleResponsePromise;
        const scheduleData = await scheduleResponse.json();
        if (!scheduleResponse.ok() || !scheduleData.ok) {
            throw new Error('schedule failed: ' + scheduleResponse.status() + ' ' + JSON.stringify(scheduleData));
        }
        expect(scheduleData.groupId).toBeTruthy();

        await expect(page.locator('#smsToast')).toContainText(/예약/);

        await page.goto('/sms/history');
        await page.waitForResponse((res) => res.url().includes('/api/sms/history') && res.ok());
        await expect(page.locator('#smsHistoryLoading')).toBeHidden();
        await expect(page.locator('#smsHistoryTableWrap')).toBeVisible();

        const bodyCell = page.locator('.sms-history-body-btn', { hasText: testBody });
        await expect(bodyCell).toBeVisible({ timeout: 30_000 });

        const row = page.locator('tr', { has: bodyCell });
        const cancelBtn = row.getByRole('button', { name: '예약 취소' });
        await expect(cancelBtn).toBeVisible();

        const cancelResponsePromise = page.waitForResponse(
            (res) => res.url().includes('/api/sms/cancel') && res.request().method() === 'POST'
        );
        await cancelBtn.click();

        const cancelResponse = await cancelResponsePromise;
        expect(cancelResponse.ok()).toBeTruthy();
        const cancelData = await cancelResponse.json();
        expect(cancelData.ok).toBe(true);

        await expect(page.locator('#smsToast')).toContainText(/취소/);

        await page.getByRole('button', { name: '새로고침' }).click();
        await page.waitForResponse((res) => res.url().includes('/api/sms/history') && res.ok());

        const rowAfter = page.locator('tr', { has: page.locator('.sms-history-body-btn', { hasText: testBody }) });
        await expect(rowAfter.getByRole('button', { name: '예약 취소' })).toHaveCount(0);
        await expect(rowAfter.locator('.sms-history-status')).toContainText(/예약 취소|접수 실패|실패/);
    });
});
