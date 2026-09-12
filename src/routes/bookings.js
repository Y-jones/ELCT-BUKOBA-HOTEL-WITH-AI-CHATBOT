const express = require('express');
const { availability, createBooking, getBooking } = require('../bookingService');
const { query } = require('../db');
const { bookingTicketText, sendWhatsAppText } = require('../whatsapp');
const { KB } = require('../retrieval');

const router = express.Router();

function dbReady(res) {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: 'Booking database is not configured' });
    return false;
  }
  return true;
}

router.get('/availability', async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const rows = await availability({
      propertyId: req.query.property_id || KB.locations[0].id,
      roomType: req.query.room_type || null,
      checkIn: req.query.check_in,
      checkOut: req.query.check_out,
      guestsCount: req.query.guests || 1,
    });
    res.json({ availability: rows });
  } catch (err) {
    console.error('[availability]', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/:reference', async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const booking = await getBooking(req.params.reference);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (err) {
    console.error('[booking:get]', err);
    res.status(500).json({ error: 'Unable to retrieve booking' });
  }
});

router.post('/', async (req, res) => {
  if (!dbReady(res)) return;
  try {
    const booking = await createBooking(req.body || {});
    let notification = { sent: false, reason: 'NOT_ATTEMPTED' };
    const ticket = bookingTicketText(booking);
    try {
      notification = await sendWhatsAppText(booking.guest.phone, ticket);
      await query(
        `INSERT INTO notification_log (booking_id, channel, recipient, notification_type, status, provider_message_id, error)
         VALUES ($1,'whatsapp',$2,'booking_confirmation',$3,$4,$5)`,
        [booking.id, booking.guest.phone, notification.sent ? 'sent' : 'not_configured', notification.providerMessageId || null, notification.reason || null]
      );
    } catch (notifyErr) {
      console.error('[whatsapp] confirmation failed:', notifyErr.message);
      notification = { sent: false, reason: 'DELIVERY_FAILED' };
      await query(
        `INSERT INTO notification_log (booking_id, channel, recipient, notification_type, status, error)
         VALUES ($1,'whatsapp',$2,'booking_confirmation','failed',$3)`,
        [booking.id, booking.guest.phone, notifyErr.message]
      );
    }

    res.status(201).json({ booking, ticket, notification });
  } catch (err) {
    const known = ['NO_AVAILABILITY','ROOM_TYPE_NOT_FOUND','ROOM_CAPACITY_EXCEEDED'].includes(err.message);
    res.status(known ? 409 : 400).json({ error: err.message });
  }
});

module.exports = router;
