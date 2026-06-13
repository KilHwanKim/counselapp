import { test, expect } from '@playwright/test';

test.describe('공통 레이아웃', () => {
    test('사이드바·통합 헤더가 모든 페이지에 보인다', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: /상담센터/ })).toBeVisible();
        await expect(page.getByText('김길환 매니저님, 환영합니다.')).toBeVisible();
        await expect(page.getByRole('button', { name: '카카오 계정 연결' })).toBeVisible();
    });

    test('사이드바 메뉴로 페이지 이동 (전체 reload 없이)', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: /학생 등록\/조회/ }).click();
        await expect(page).toHaveURL(/\/students$/);
        await expect(page.getByRole('heading', { name: '학생 관리' })).toBeVisible();

        await page.getByRole('link', { name: /수업 등록\/수정/ }).click();
        await expect(page).toHaveURL(/\/lessons$/);
        await expect(page.getByRole('heading', { name: '주간 수업 일정' })).toBeVisible();

        await page.getByRole('link', { name: /일지 조회/ }).click();
        await expect(page).toHaveURL(/\/journals$/);
        await expect(page.getByRole('heading', { name: '학생별 월간 일지 조회' })).toBeVisible();
    });
});

test.describe('메인 달력 (/)', () => {
    test('월 제목·달력·상세 패널이 로드된다', async ({ page }) => {
        await page.goto('/');
        const monthTitle = page.locator('#monthTitle');
        await expect(monthTitle).not.toBeEmpty({ timeout: 20_000 });

        const calendarDays = page.locator('#calendarGrid [data-date]');
        await expect(calendarDays.first()).toBeVisible();
        expect(await calendarDays.count()).toBeGreaterThan(0);

        await expect(page.locator('#detailTitle')).toBeVisible();
    });

    test('날짜 클릭 시 상세 패널이 갱신된다', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#monthTitle')).not.toBeEmpty({ timeout: 20_000 });

        const firstDay = page.locator('#calendarGrid [data-date]').first();
        const dateStr = await firstDay.getAttribute('data-date');
        await firstDay.click();

        await expect(page.locator('#detailTitle')).not.toHaveText('날짜를 선택하세요');
        await expect(page.locator('#detailSubtitle')).toContainText(/년|없습니다|목록/);
    });

    test('보강 모달이 열리고 닫힌다', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#monthTitle')).not.toBeEmpty({ timeout: 20_000 });

        await page.locator('#calendarGrid [data-date]').first().click();
        const makeupBtn = page.locator('#makeupBtn');
        await expect(makeupBtn).toBeVisible({ timeout: 10_000 });
        await makeupBtn.click();

        const modal = page.locator('#makeupModal');
        await expect(modal).not.toHaveClass(/hidden/);
        await expect(page.locator('#makeupForm')).toBeVisible();

        await page.locator('#makeupModalCloseBtn').click();
        await expect(modal).toHaveClass(/hidden/);
    });
});

test.describe('학생 관리 (/students)', () => {
    test('목록 API 로드 후 테이블 또는 빈 상태가 보인다', async ({ page }) => {
        await page.goto('/students');
        await page.waitForResponse((res) => res.url().includes('/api/students') && res.ok());

        const errorCell = page.locator('#gridBody td.text-red-600');
        await expect(errorCell).toHaveCount(0);

        const hasRows = await page.locator('#gridBody tr').count();
        const emptyVisible = await page.locator('#gridEmpty:not(.hidden)').isVisible();
        expect(hasRows > 0 || emptyVisible).toBeTruthy();
    });

    test('추가 모달 열기·닫기', async ({ page }) => {
        await page.goto('/students');
        await page.waitForResponse((res) => res.url().includes('/api/students') && res.ok());

        await page.locator('#addBtn').click();
        const modal = page.locator('#modal');
        await expect(modal).not.toHaveClass(/hidden/);
        await expect(page.locator('#modalTitle')).toHaveText('학생 추가');

        await page.locator('#modalCancel').click();
        await expect(modal).toHaveClass(/hidden/);
    });
});

test.describe('수업 시간표 (/lessons)', () => {
    test('시간표·등록 버튼이 로드된다', async ({ page }) => {
        await page.goto('/lessons');
        await page.waitForResponse((res) => res.url().includes('/api/lessons') && res.ok());

        await expect(page.locator('#registerBtn')).toBeVisible();
        await expect(page.locator('#timeLabels .hour-row').first()).toBeVisible();
        await expect(page.locator('.lesson-slot').first()).toBeVisible();
    });

    test('수업 등록 모달 열기·닫기', async ({ page }) => {
        await page.goto('/lessons');
        await page.waitForResponse((res) => res.url().includes('/api/lessons') && res.ok());

        await page.locator('#registerBtn').click();
        const modal = page.locator('#slotModal');
        await expect(modal).not.toHaveClass(/hidden/);
        await expect(page.locator('#slotModalTitle')).toHaveText('수업 등록');

        await page.locator('#slotCancelBtn').click();
        await expect(modal).toHaveClass(/hidden/);
    });
});

test.describe('일지 조회 (/journals)', () => {
    test('월간 목록이 로드된다', async ({ page }) => {
        await page.goto('/journals');
        await page.waitForResponse((res) => res.url().includes('/api/actual-lessons') && res.ok());

        await expect(page.locator('#monthFilter')).toBeVisible();
        await expect(page.locator('#listSummary')).not.toHaveText('조회 실패');
        await expect(page.locator('#journalList')).not.toBeEmpty();
    });
});
