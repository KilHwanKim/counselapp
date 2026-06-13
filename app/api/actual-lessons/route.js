import handler from '../../../api/actual-lessons.js';
import { runApiHandler } from '@/lib/run-api-handler.js';

export async function GET(request) {
    return runApiHandler(handler, request);
}

export async function POST(request) {
    return runApiHandler(handler, request);
}

export async function PATCH(request) {
    return runApiHandler(handler, request);
}
