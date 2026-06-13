import handler from '../../../../api/cron/sync-actual-lessons.js';
import { runApiHandler } from '@/lib/run-api-handler.js';

export async function GET(request) {
    return runApiHandler(handler, request);
}
