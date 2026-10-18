import { test, expect } from '@playwright/test';

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const todayStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());

test('뒤로가기 → 확인 팝업 (취소하면 유지, 확인하면 모달만 닫힘)', async ({ page }) => {
    await page.route('**/api/**', (route) => {
        const url = route.request().url();
        if (url.includes('/api/actual-lessons')) {
            return route.fulfill({ json: { ok: true, actual_lessons: [{ id: 1, lesson_date: todayStr, start_time: '10:00', end_time: '11:00', student_name: '테스트', status: 'scheduled' }] } });
        }
        if (url.includes('/api/holidays')) return route.fulfill({ json: { ok: true, holidays: [] } });
        return route.fulfill({ json: { ok: true, students: [], attachments: [], journals: [] } });
    });
    let answer = 'dismiss';
    page.on('dialog', async (d) => {
        console.log('[팝업]', d.message(), '→', answer);
        await page.waitForTimeout(2000);
        answer === 'accept' ? d.accept() : d.dismiss();
    });
    await page.goto('/students');
    await page.click('a[href="/"]');
    await page.locator('.journal-lesson-btn').first().click();
    await page.locator('#journalLessonContent').pressSequentially('수업 내용 작성 중...', { delay: 80 });
    await page.waitForTimeout(1000);

    await page.goBack();
    await page.waitForTimeout(1500);
    console.log('취소 후 → URL:', page.url(), '/ 모달 보임:', await page.locator('#journalModal').isVisible());
    await expect(page.locator('#journalModal')).toBeVisible();

    answer = 'accept';
    await page.goBack();
    await page.waitForTimeout(1500);
    console.log('확인 후 → URL:', page.url(), '/ 모달 보임:', await page.locator('#journalModal').isVisible());
    await expect(page).toHaveURL(/3001\/$/);
    await page.waitForTimeout(2000);
});

test('캘린더: 작성 중 새로고침 후 뒤로가기 한 번에 이전 페이지', async ({ page }) => {
    await page.route('**/api/**', (route) => {
        const url = route.request().url();
        if (url.includes('/api/actual-lessons')) {
            return route.fulfill({ json: { ok: true, actual_lessons: [{ id: 1, lesson_date: todayStr, start_time: '10:00', end_time: '11:00', student_name: '테스트', status: 'scheduled' }] } });
        }
        return route.fulfill({ json: { ok: true, holidays: [], students: [], attachments: [] } });
    });
    page.on('dialog', (d) => { console.log('[팝업]', d.type(), d.message().split('\n')[0]); d.accept(); });
    await page.goto('/students');
    await page.click('a[href="/"]');
    await page.locator('.journal-lesson-btn').first().click();
    await page.fill('#journalLessonContent', '작성중');
    await page.reload();
    await page.locator('.journal-lesson-btn').first().click();
    await expect(page.locator('#journalLessonContent')).toHaveValue('작성중');
    await page.click('#journalModalConfirmBtn');
    await page.waitForTimeout(800);
    await page.goBack();
    await expect(page).toHaveURL(/\/students$/);
});
