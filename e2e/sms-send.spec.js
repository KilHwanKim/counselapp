import { test, expect } from '@playwright/test';

test.describe('문자 발송 (/sms/send)', () => {
    test('학생 선택 후 즉시 발송 API가 성공한다', async ({ page }) => {
        page.on('dialog', (dialog) => dialog.accept());

        const uniqueName = 'E2E문자' + Date.now();
        const createRes = await page.request.post('/api/students', {
            data: {
                name: uniqueName,
                parent_phone: '01077690817',
            },
        });
        expect(createRes.ok()).toBeTruthy();

        await page.goto('/sms/send');
        await expect(page.getByRole('button', { name: '즉시 발송' })).toBeVisible();

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
        await expect(page.locator('#smsPhoneWarning')).toBeHidden();

        const testBody = 'E2E 테스트 문자 ' + Date.now();
        await page.locator('#smsBody').fill(testBody);

        const sendResponsePromise = page.waitForResponse(
            (res) => res.url().includes('/api/sms/send') && res.request().method() === 'POST'
        );
        await page.getByRole('button', { name: '즉시 발송' }).click();

        const sendResponse = await sendResponsePromise;
        expect(sendResponse.ok()).toBeTruthy();
        const sendData = await sendResponse.json();
        expect(sendData.ok).toBe(true);
        expect(sendData.groupId || sendData.messageId).toBeTruthy();

        await expect(page.locator('#smsToast')).toContainText(/발송|기록/);

        await page.goto('/sms/history');
        await page.waitForResponse((res) => res.url().includes('/api/sms/history') && res.ok());
        await expect(page.locator('#smsHistoryLoading')).toBeHidden();
        await expect(page.locator('#smsHistoryTableWrap')).toBeVisible();
    });

    test('학생 미선택 시 발송 버튼이 에러를 표시한다', async ({ page }) => {
        await page.goto('/sms/send');
        await page.locator('#smsBody').fill('내용만 있는 테스트');
        await page.getByRole('button', { name: '즉시 발송' }).click();
        await expect(page.locator('#smsFormError')).toContainText('학생을 선택');
    });
});
