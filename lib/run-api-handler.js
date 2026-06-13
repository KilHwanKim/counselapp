/**
 * Bridges Vercel-style api/*.js handlers to Next.js App Router route handlers.
 */
export async function runApiHandler(handler, request) {
    const url = new URL(request.url);
    let body = {};
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
            body = await request.json();
        } catch {
            body = {};
        }
    }

    const query = Object.fromEntries(url.searchParams.entries());
    let statusCode = 200;
    let responseBody = null;
    let settled = false;

    const req = {
        method: request.method,
        query,
        body,
    };

    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseBody = data;
            settled = true;
            return this;
        },
    };

    await handler(req, res);

    if (!settled) {
        return new Response(null, { status: statusCode });
    }
    return Response.json(responseBody, { status: statusCode });
}
