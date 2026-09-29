import https from "node:https";

const json = (response, statusCode, body) => {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.end(JSON.stringify(body));
};

const postJson = (url, apiKey, payload) => new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const data = JSON.stringify(payload);
    const request = https.request({
        hostname: parsedUrl.hostname,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data)
        }
    }, (res) => {
        res.on("error", reject);
        res.resume();
        res.on("end", () => {
            resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode
            });
        });
    });

    request.on("error", reject);
    const deadline = setTimeout(() => request.destroy(new Error("Email request timed out")), 8000);
    request.on("close", () => clearTimeout(deadline));
    request.write(data);
    request.end();
});

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_RATE_LIMIT_KEYS = 10000;
const CONTACT_TO = "eraydumaan57@gmail.com";
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = new Set([
    "https://tokogluahsap.com",
    "https://www.tokogluahsap.com",
    ...configuredOrigins
]);

const clean = (value, maxLength = 1000) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
};

const parseBody = (body) => {
    if (!body) return {};
    if (typeof body === "string") {
        const normalized = body.replace(/^\uFEFF/, "").trim();
        return normalized ? JSON.parse(normalized) : {};
    }
    if (Buffer.isBuffer(body)) {
        const normalized = body.toString("utf8").replace(/^\uFEFF/, "").trim();
        return normalized ? JSON.parse(normalized) : {};
    }
    return body;
};

const getClientIp = (request) => {
    const forwardedFor = request.headers["x-forwarded-for"];
    if (process.env.VERCEL === "1" && typeof forwardedFor === "string" && forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    return request.socket?.remoteAddress || "unknown";
};

const isRateLimited = (key) => {
    const now = Date.now();
    // Best-effort per-instance protection; not a distributed rate limiter.
    for (const [ip, value] of rateLimitStore) {
        if (now - value.startedAt >= RATE_LIMIT_WINDOW_MS) rateLimitStore.delete(ip);
    }
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.startedAt > RATE_LIMIT_WINDOW_MS) {
        if (rateLimitStore.size >= MAX_RATE_LIMIT_KEYS) return true;
        rateLimitStore.set(key, { count: 1, startedAt: now });
        return false;
    }

    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX;
};

const projectLabels = {
    mutfak: "Mutfak Tasarımı",
    yatak: "Yatak Odası / Giyinme Odası",
    tv: "Salon / TV Ünitesi",
    banyo: "Banyo Dolap Grubu",
    diger: "Özel Ahşap Projesi"
};

export default async function handler(request, response) {
    try {
        if (request.method !== "POST") {
            response.setHeader("Allow", "POST");
            return json(response, 405, { message: "Sadece POST istekleri kabul edilir." });
        }

        const origin = request.headers.origin;
        if (typeof origin !== "string" || !allowedOrigins.has(origin)) {
            return json(response, 403, { message: "Bu kaynaktan form gönderimi kabul edilmez." });
        }

        const contentType = request.headers["content-type"] || "";
        if (typeof contentType !== "string" || contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
            return json(response, 415, { message: "Geçersiz istek türü." });
        }

        const ip = getClientIp(request);
        if (isRateLimited(ip)) {
            response.setHeader("Retry-After", "60");
            return json(response, 429, { message: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin." });
        }

        const rawBody = request.body;
        const bodyBytes = Buffer.isBuffer(rawBody) ? rawBody.length
            : Buffer.byteLength(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody ?? {}));
        if (bodyBytes > MAX_BODY_BYTES || Number(request.headers["content-length"]) > MAX_BODY_BYTES) {
            return json(response, 413, { message: "Form içeriği çok büyük." });
        }
        let body;
        try {
            body = parseBody(rawBody);
        } catch {
            return json(response, 400, { message: "Geçersiz JSON içeriği." });
        }
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return json(response, 400, { message: "Geçersiz form içeriği." });
        }

        if (clean(body.company, 200)) {
            return json(response, 200, { message: "Talebiniz alındı." });
        }

        const limits = { name: 120, phone: 60, city: 120, projectType: 60, message: 2000 };
        for (const [field, limit] of Object.entries(limits)) {
            const value = body[field];
            if (typeof value !== "string" || !value.trim() || value.length > limit ||
                /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value) ||
                (field !== "message" && /[\r\n]/.test(value))) {
                return json(response, 400, { message: "Lütfen form alanlarını kontrol edin." });
            }
        }
        if (!Object.hasOwn(projectLabels, body.projectType.trim())) {
            return json(response, 400, { message: "Geçersiz proje türü." });
        }

        const name = clean(body.name, 120);
        const phone = clean(body.phone, 60);
        const city = clean(body.city, 120);
        const projectType = clean(body.projectType, 60);
        const message = clean(body.message, 2000);
        const projectLabel = projectLabels[projectType] || projectType || "Belirtilmedi";

        if (!name || !phone || !city || !projectType || !message) {
            return json(response, 400, { message: "Lütfen tüm zorunlu alanları doldurun." });
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        const to = CONTACT_TO;
        const from = process.env.CONTACT_FROM || "Tokoğlu Ahşap <onboarding@resend.dev>";

        if (!resendApiKey) {
            return json(response, 500, { message: "Form şu anda gönderilemedi. Lütfen daha sonra tekrar deneyin." });
        }

        const subject = `Yeni teklif formu: ${name}`;
        const text = [
            "Yeni teklif formu gönderildi.",
            "",
            `Ad Soyad: ${name}`,
            `Telefon: ${phone}`,
            `Şehir: ${city}`,
            `Proje Türü: ${projectLabel}`,
            "",
            "Notlar:",
            message
        ].join("\n");

        const resendResponse = await postJson("https://api.resend.com/emails", resendApiKey, {
            from,
            to,
            subject,
            text,
            reply_to: to
        });

        if (!resendResponse.ok) {
            return json(response, 502, { message: "Mail gönderilemedi. Lütfen daha sonra tekrar deneyin." });
        }

        return json(response, 200, { message: "Talebiniz alındı." });
    } catch {
        return json(response, 500, { message: "Form işlenemedi. Lütfen daha sonra tekrar deneyin." });
    }
}
