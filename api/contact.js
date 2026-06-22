const json = (response, statusCode, body) => {
    response.status(statusCode).json(body);
};

const clean = (value, maxLength = 1000) => {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
};

const projectLabels = {
    mutfak: "Mutfak Tasarımı",
    yatak: "Yatak Odası / Giyinme Odası",
    tv: "Salon / TV Ünitesi",
    banyo: "Banyo Dolap Grubu",
    diger: "Özel Ahşap Projesi"
};

export default async function handler(request, response) {
    if (request.method !== "POST") {
        return json(response, 405, { message: "Sadece POST istekleri kabul edilir." });
    }

    const body = request.body || {};

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
    const to = process.env.CONTACT_TO || "info@tokogluahsap.com";
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

    const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from,
            to,
            subject,
            text,
            reply_to: to
        })
    });

    if (!resendResponse.ok) {
        return json(response, 502, { message: "Mail gönderilemedi. Lütfen daha sonra tekrar deneyin." });
    }

    return json(response, 200, { message: "Talebiniz alındı." });
}
