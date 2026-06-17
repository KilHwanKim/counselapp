/**
 * 솔라피 실발송 테스트 (로컬 전용)
 * 사용: node scripts/send-sms-test.js [수신번호] [문자내용]
 */
import dotenv from 'dotenv';
import { sendSolapiMessage, normalizePhone } from '../lib/sms/solapi.js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const to = process.argv[2] || '01077690817';
const text = process.argv[3] || 'counselapp 솔라피 실발송 테스트입니다.';
const from = normalizePhone(process.env.SMS_FROM_NUMBER);

if (!process.env.SOLAPI_API_KEY || !process.env.SOLAPI_API_SECRET) {
    console.error('FAIL: SOLAPI_API_KEY, SOLAPI_API_SECRET을 .env.local에 설정하세요.');
    process.exit(1);
}
if (!from) {
    console.error('FAIL: SMS_FROM_NUMBER(사전등록 발신번호)를 .env.local에 설정하세요.');
    process.exit(1);
}

console.log('발신:', from);
console.log('수신:', normalizePhone(to));
console.log('내용:', text);

const result = await sendSolapiMessage({ to, from, text });

if (!result.ok) {
    console.error('FAIL:', result.error);
    if (result.detail) console.error(result.detail);
    process.exit(1);
}

console.log('OK: groupId =', result.groupId, 'type =', result.messageType);
