import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import handler from '../api/contact.js';

let nextIp = 0;
const valid = { name: 'Test User', phone: '05361234567', city: 'İstanbul', projectType: 'mutfak', message: 'Teklif istiyorum.' };
async function send(overrides = {}) {
    const request = { method: 'POST', headers: { origin: 'https://tokogluahsap.com', 'content-type': 'application/json' }, socket: { remoteAddress: `test-${++nextIp}` }, body: valid, ...overrides };
    const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = JSON.parse(body); } };
    await handler(request, response);
    assert.equal(response.headers['Cache-Control'], 'no-store');
    return response;
}

test('rejects unsupported methods, origins and media types', async () => {
    const method = await send({ method: 'GET' });
    assert.equal(method.statusCode, 405);
    assert.equal(method.headers.Allow, 'POST');
    for (const origin of [undefined, 'null', 'https://evil.example']) {
        assert.equal((await send({ headers: { origin, 'content-type': 'application/json' } })).statusCode, 403);
    }
    assert.equal((await send({ headers: { origin: 'https://tokogluahsap.com', 'content-type': 'text/application/json' } })).statusCode, 415);
});

test('rejects malformed, non-object and oversized payloads', async () => {
    for (const body of ['{', 'null', '[]', '42', '"text"', null, []]) {
        assert.equal((await send({ body })).statusCode, 400);
    }
    assert.equal((await send({ body: 'x'.repeat(16385) })).statusCode, 413);
    assert.equal((await send({ body: Buffer.from('x'.repeat(16385)) })).statusCode, 413);
    assert.equal((await send({ body: { ...valid, extra: 'ş'.repeat(9000) } })).statusCode, 413);
});

test('rejects header injection, oversized fields and unknown project types', async () => {
    for (const patch of [{ name: 'User\r\nBcc: victim@example.com' }, { message: 'x'.repeat(2001) }, { phone: 123 }, { city: ' ' }, { projectType: '__proto__' }, { projectType: 'constructor' }]) {
        assert.equal((await send({ body: { ...valid, ...patch } })).statusCode, 400);
    }
});

test('honeypot succeeds without sending email and repeated requests are limited', async () => {
    const socket = { remoteAddress: 'rate-limit-test' };
    for (let i = 0; i < 5; i++) assert.equal((await send({ socket, body: { company: 'bot' } })).statusCode, 200);
    const limited = await send({ socket, body: { company: 'bot' } });
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.headers['Retry-After'], '60');
});

test('valid payload reaches email provider; upstream failures are handled', async (t) => {
    const oldKey = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = 'test-only';
    t.after(() => { if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey; });
    let statusCode = 200;
    let sent;
    t.mock.method(https, 'request', (options, callback) => {
        assert.equal(options.hostname, 'api.resend.com');
        const request = new EventEmitter();
        request.write = (data) => { sent = JSON.parse(data); };
        request.end = () => queueMicrotask(() => {
            const response = new EventEmitter();
            response.statusCode = statusCode;
            response.resume = () => {};
            callback(response);
            response.emit('end');
            request.emit('close');
        });
        return request;
    });
    assert.equal((await send({ body: JSON.stringify(valid) })).statusCode, 200);
    assert.equal(sent.subject, 'Yeni teklif formu: Test User');
    assert.match(sent.text, /Mutfak Tasarımı/);
    statusCode = 503;
    assert.equal((await send({ body: Buffer.from(JSON.stringify(valid)) })).statusCode, 502);
});
