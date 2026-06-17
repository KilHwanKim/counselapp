export const SMS_VARIABLES = [
    { key: 'child_name', label: '학생 이름', example: '홍길동' },
    { key: 'parent_phone', label: '부모 전화번호', example: '010-1234-5678' },
    { key: 'today_date', label: '오늘 날짜', example: '2026년 6월 14일 (일)' },
    { key: 'lesson_date', label: '수업 날짜', example: '2026년 6월 20일 (토)' },
    { key: 'lesson_time', label: '수업 시간', example: '14:00' }
];

export const DEFAULT_SMS_TEMPLATES = [
    {
        name: '보강 안내',
        body: '안녕하세요. {child_name} 학생 보강 수업이 {lesson_date} {lesson_time}으로 잡혔습니다. 확인 부탁드립니다.'
    },
    {
        name: '수업 취소',
        body: '안녕하세요. {child_name} 학생 {lesson_date} {lesson_time} 수업이 취소되었습니다. 보강 일정은 따로 연락드리겠습니다.'
    }
];
