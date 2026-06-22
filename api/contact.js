import https from "node:https";

const json = (response, statusCode, body) => {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
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
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
            body += chunk;
        });
        res.on("end", () => {
            resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                body
            });
        });
    });

    request.on("error", reject);
    request.write(data);
    request.end();
});

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
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

const getClientIp = (request) => {
    const forwardedFor = request.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }
    return request.socket?.remoteAddress || "unknown";
};

const isRateLimited = (key) => {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.startedAt > RATE_LIMIT_WINDOW_MS) {
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
            return json(response, 405, { message: "Sadece POST istekleri kabul edilir." });
        }

        const origin = request.headers.origin;
        if (origin && !allowedOrigins.has(origin)) {
            return json(response, 403, { message: "Bu kaynaktan form gönderimi kabul edilmez." });
        }

        const contentType = request.headers["content-type"] || "";
        if (!contentType.includes("application/json")) {
            return json(response, 415, { message: "Geçersiz istek türü." });
        }

        const ip = getClientIp(request);
        if (isRateLimited(ip)) {
            return json(response, 429, { message: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin." });
        }

        const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};

        if (clean(body.company, 200)) {
            return json(response, 200, { message: "Talebiniz alındı." });
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
            return json(response, 500, { message: "Mail servisi henüz yapılandırılmadı." });
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
