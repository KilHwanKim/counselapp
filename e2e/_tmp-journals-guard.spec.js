import { test, expect } from '@playwright/test';

// 임시 확인용 (커밋 금지) — API는 전부 가짜 응답으로 대체, DB 접근 없음
const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const todayStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());

async function setup(page, answers) {
    await page.route('**/api/**', (route) => {
        const url = route.request().url();
        if (url.includes('/api/actual-lessons')) {
            return route.fulfill({ json: { ok: true, actual_lessons: [
                { id: 1, lesson_date: todayStr, start_time: '10:00', end_time: '11:00', student_id: 1, student_name: '학생A', status: 'scheduled' },
                { id: 2, lesson_date: todayStr, start_time: '12:00', end_time: '13:00', student_id: 2, student_name: '학생B', status: 'scheduled' },
            ] } });
        }
        if (url.includes('/api/lesson-journals')) return route.fulfill({ json: { ok: true, journal_id: 99 } });
        return route.fulfill({ json: { ok: true, students: [], attachments: [], holidays: [] } });
    });
    const log = [];
    page.on('dialog', async (d) => {
        const a = answers.shift() || 'accept';
        log.push(d.type() + ':' + d.message().split('\n')[0] + ' → ' + a);
        a === 'accept' ? await d.accept() : await d.dismiss();
    });
    await page.goto('/students');
    await page.click('a[href="/journals"]');
    await expect(page).toHaveURL(/\/journals$/);
    await expect(page.locator('#journalDetailLessonContent')).toBeVisible();
    return log;
}

const content = (page) => page.locator('#journalDetailLessonContent');

test('뒤로가기: 취소 → 유지, 확인 → 이전 페이지', async ({ page }) => {
    const answers = ['dismiss', 'accept'];
    const log = await setup(page, answers);
    await content(page).fill('작성중 내용');
    await page.goBack();
    await page.waitForTimeout(800);
    expect(page.url()).toMatch(/\/journals$/);
    await expect(content(page)).toHaveValue('작성중 내용');
    await page.goBack();
    await expect(page).toHaveURL(/\/students$/);
    console.log(log);
});

test('다른 행 클릭 / 월 변경 / 사이드바 링크: 취소 시 유지', async ({ page }) => {
    const answers = ['dismiss', 'dismiss', 'dismiss', 'accept'];
    const log = await setup(page, answers);
    await content(page).fill('작성중 내용');
    await page.locator('.journal-list-row[data-id="2"]').click();
    await expect(page.locator('#detailTitle')).toHaveText('학생A 일지');
    const before = await page.locator('#monthFilter').inputValue();
    await page.locator('#monthFilter').fill('2020-01');
    await expect(page.locator('#monthFilter')).toHaveValue(before);
    await page.click('a[href="/lessons"]');
    await page.waitForTimeout(800);
    expect(page.url()).toMatch(/\/journals$/);
    await expect(content(page)).toHaveValue('작성중 내용');
    await page.locator('.journal-list-row[data-id="2"]').click();
    await expect(page.locator('#detailTitle')).toHaveText('학생B 일지');
    console.log(log);
});

test('임시저장 복원 + 저장 후엔 확인 없이 뒤로가기', async ({ page }) => {
    const answers = ['accept', 'accept', 'accept'];
    const log = await setup(page, answers);
    await content(page).fill('새로고침 전 내용');
    await page.reload();
    await expect(content(page)).toHaveValue('새로고침 전 내용');
    await page.click('#journalDetailSaveBtn');
    await page.waitForTimeout(800);
    await page.reload();
    await page.waitForTimeout(800);
    await page.goBack();
    await expect(page).toHaveURL(/\/students$/);
    console.log(log);
});
