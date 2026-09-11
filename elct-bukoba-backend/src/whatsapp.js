/**
 * Turns the hotel's published WhatsApp number + a short summary into a
 * tap-to-send wa.me link. The phone number always comes from
 * knowledge_base.json (never from anything the model says), so this can't
 * be hijacked into linking somewhere else.
 */
function buildWhatsAppLink(rawPhone, message) {
  const digits = String(rawPhone).replace(/[^\d]/g, '');
  const text = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${text}`;
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
    de: 'Hallo, ich möchte gerne mit jemandem vom Hotel sprechen.',
  }[lang] || "Hi, I'd like to speak with someone at the hotel.";
  return buildWhatsAppLink(whatsappNumber, text);
}

module.exports = { buildWhatsAppLink, buildHandoffLink, buildHumanHandoffLink };
