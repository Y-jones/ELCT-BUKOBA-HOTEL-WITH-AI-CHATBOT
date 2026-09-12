const https = require('https');

function buildWhatsAppLink(rawPhone, message) {
  const digits = String(rawPhone).replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function buildHandoffLink(whatsappNumber, summary, lang) {
  const prefix = {
    en: "Hi, I'd like to check availability for: ",
    sw: 'Habari, ningependa kuangalia upatikanaji wa: ',
    fr: "Bonjour, je voudrais vérifier la disponibilité pour : ",
    de: 'Hallo, ich möchte die Verfügbarkeit prüfen für: ',
  }[lang] || "Hi, I'd like to check availability for: ";
  return buildWhatsAppLink(whatsappNumber, prefix + summary);
}

function buildHumanHandoffLink(whatsappNumber, lang) {
  const text = {
    en: "Hi, I'd like to speak with someone at the hotel.",
    sw: 'Habari, ningependa kuzungumza na mtu hotelini.',
    fr: "Bonjour, j'aimerais parler à quelqu'un de l'hôtel.",
    de: 'Hallo, ich möchte gerne mit jemandem vom Hotel.',
  }[lang] || "Hi, I'd like to speak with someone at the hotel.";
  return buildWhatsAppLink(whatsappNumber, text);
}

function formatBookingDate(value) {
  if (!value) return 'To be confirmed';
  const raw = String(value);
  const datePart = raw.slice(0, 10);
  const date = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function bookingTicketText(booking) {
  const amount = booking.total_amount != null
    ? `${booking.currency} ${Number(booking.total_amount).toLocaleString('en-US')}`
    : 'To be confirmed';
  return [
    '🎫 ELCT BUKOBA HOTEL & TOURS',
    'BOOKING CONFIRMED ✅',
    '',
    `Booking: ${booking.booking_reference}`,
    `Guest: ${booking.guest_name || booking.guest?.name}`,
    `Room: ${booking.room_type}`,
    '',
    `Check-in: ${formatBookingDate(booking.check_in)}`,
    `Check-out: ${formatBookingDate(booking.check_out)}`,
    `Guests: ${booking.guests_count}`,
    `Total: ${amount}`,
    '',
    'Please keep this booking reference and present it when you arrive.',
    'Karibu sana — we look forward to welcoming you! 🌿',
  ].join('\n');
}

function sendWhatsAppText(to, body) {
  return new Promise((resolve, reject) => {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
    if (!token || !phoneNumberId) {
      resolve({ sent: false, reason: 'WHATSAPP_NOT_CONFIGURED' });
      return;
    }

    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: String(to).replace(/\D/g, ''),
      type: 'text',
      text: { preview_url: false, body },
    });

    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/${version}/${phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = {}; }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ sent: true, providerMessageId: parsed.messages?.[0]?.id || null });
        } else {
          reject(new Error(`WhatsApp API ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { buildWhatsAppLink, buildHandoffLink, buildHumanHandoffLink, bookingTicketText, sendWhatsAppText };
