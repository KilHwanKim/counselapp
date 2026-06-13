import handler from '../../../api/db-tables.js';
import { runApiHandler } from '@/lib/run-api-handler.js';

export async function GET(request) {
    return runApiHandler(handler, request);
}
