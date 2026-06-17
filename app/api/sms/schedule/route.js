import handler from '../../../../server/handlers/sms-schedule.js';
import { runApiHandler } from '@/lib/run-api-handler.js';

export async function POST(request) {
    return runApiHandler(handler, request);
}
