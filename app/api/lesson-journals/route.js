import handler from '../../../server/handlers/lesson-journals.js';
import { runApiHandler } from '@/lib/run-api-handler.js';

export async function GET(request) {
    return runApiHandler(handler, request);
}

export async function POST(request) {
    return runApiHandler(handler, request);
}

export async function DELETE(request) {
    return runApiHandler(handler, request);
}
