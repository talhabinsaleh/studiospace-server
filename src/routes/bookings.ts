import { Router } from "express";
import { ClientSession, ObjectId } from "mongodb";
import { Booking, BookingStatus, client, collections } from "../db";
import { verifyToken } from "../middleware/auth";
import { asObjectId, HttpError, wrap } from "../utils";

const router = Router();
router.use(verifyToken);

const MAX_HOURS = 14;

function formatRange(start: Date, end: Date) {
  return `${start.toISOString().slice(0, 16).replace("T", " ")} to ${end.toISOString().slice(11, 16)} UTC`;
}

// Two time ranges overlap when each one starts before the other one ends
async function findConfirmedOverlap(studioId: ObjectId, start: Date, end: Date, session?: ClientSession) {
  const { bookings } = await collections();
  return bookings.findOne(
    { studioId, status: "Confirmed", start: { $lt: end }, end: { $gt: start } },
    { session },
  );
}

router.post("/", wrap(async (req, res) => {
  const { studios, bookings } = await collections();
  const studio = await studios.findOne({ _id: asObjectId(req.body.studioId) });
  if (!studio) throw new HttpError(404, "Studio not found.");
  if (studio.ownerEmail === req.user!.email) throw new HttpError(400, "You cannot book your own studio.");

  const start = new Date(req.body.start);
  const end = new Date(req.body.end);
  const guests = Number(req.body.guests);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new HttpError(400, "Please choose a valid date and time.");
  if (start.getTime() <= Date.now()) throw new HttpError(400, "The start time must be in the future.");

  const hours = (end.getTime() - start.getTime()) / 3_600_000;
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) {
    throw new HttpError(400, `Bookings must be from 1 to ${MAX_HOURS} whole hours.`);
  }
  if (!Number.isInteger(guests) || guests < 1) throw new HttpError(400, "Guests must be at least 1.");
  if (guests > studio.maxCapacity) throw new HttpError(400, `This studio fits ${studio.maxCapacity} people at most.`);

  const clash = await findConfirmedOverlap(studio._id as ObjectId, start, end);
  if (clash) {
    throw new HttpError(
      409,
      `This slot overlaps a confirmed booking (${formatRange(clash.start, clash.end)}). Please choose another time.`,
    );
  }
  const ownPending = await bookings.findOne({
    studioId: studio._id as ObjectId,
    userEmail: req.user!.email,
    status: "Pending",
    start: { $lt: end },
    end: { $gt: start },
  });
  if (ownPending) throw new HttpError(409, "You already have a pending request that overlaps this time.");

  const subtotal = studio.hourlyRate * hours;
  const doc: Booking = {
    studioId: studio._id as ObjectId,
    studioTitle: studio.title,
    studioImage: studio.image,
    location: studio.location,
    hostEmail: studio.ownerEmail,
    hostName: studio.ownerName,
    userEmail: req.user!.email,
    userName: req.user!.name,
    start,
    end,
    hours,
    guests,
    note: typeof req.body.note === "string" ? req.body.note.trim().slice(0, 500) : "",
    hourlyRate: studio.hourlyRate,
    securityDeposit: studio.securityDeposit,
    subtotal,
    total: subtotal + studio.securityDeposit,
    status: "Pending",
    createdAt: new Date(),
  };
  const result = await bookings.insertOne(doc);
  res.status(201).json({ ...doc, _id: result.insertedId });
}));

router.get("/mine", wrap(async (req, res) => {
  const { bookings } = await collections();
  res.json(await bookings.find({ userEmail: req.user!.email }).sort({ start: -1 }).toArray());
}));

router.get("/host", wrap(async (req, res) => {
  const { bookings } = await collections();
  res.json(await bookings.find({ hostEmail: req.user!.email }).sort({ start: -1 }).toArray());
}));

router.get("/stats", wrap(async (req, res) => {
  const { bookings, studios, wishlist } = await collections();
  const email = req.user!.email;
  const [listings, saved, asGuest, asHost] = await Promise.all([
    studios.countDocuments({ ownerEmail: email }),
    wishlist.countDocuments({ userEmail: email }),
    bookings
      .aggregate<{ _id: BookingStatus; count: number }>([
        { $match: { userEmail: email } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray(),
    bookings
      .aggregate<{ _id: BookingStatus; count: number; earned: number }>([
        { $match: { hostEmail: email } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            earned: { $sum: "$subtotal" },
          },
        },
      ])
      .toArray(),
  ]);
  res.json({ listings, saved, asGuest, asHost });
}));

router.patch("/:id/cancel", wrap(async (req, res) => {
  const { bookings } = await collections();
  const result = await bookings.findOneAndUpdate(
    { _id: asObjectId(req.params.id), userEmail: req.user!.email, status: "Pending" },
    { $set: { status: "Cancelled" } },
    { returnDocument: "after" },
  );
  if (!result) throw new HttpError(409, "Only your own pending bookings can be cancelled.");
  res.json(result);
}));

// Hosts move a booking through its life cycle: Pending -> Confirmed -> Completed, or Cancelled
const ALLOWED: Record<string, BookingStatus[]> = {
  Confirmed: ["Pending"],
  Cancelled: ["Pending", "Confirmed"],
  Completed: ["Confirmed"],
};

router.patch("/:id/status", wrap(async (req, res) => {
  const { studios, bookings } = await collections();
  const _id = asObjectId(req.params.id);
  const status = String(req.body.status) as BookingStatus;
  if (!ALLOWED[status]) throw new HttpError(400, "That status is not allowed.");

  const booking = await bookings.findOne({ _id });
  if (!booking) throw new HttpError(404, "Booking not found.");
  if (booking.hostEmail !== req.user!.email) throw new HttpError(403, "Only the host can change this booking.");
  if (!ALLOWED[status].includes(booking.status)) {
    throw new HttpError(409, `A ${booking.status.toLowerCase()} booking cannot be marked ${status.toLowerCase()}.`);
  }
  if (status === "Completed" && booking.end.getTime() > Date.now()) {
    throw new HttpError(409, "A booking can only be completed after its end time.");
  }

  if (status !== "Confirmed") {
    res.json(await bookings.findOneAndUpdate({ _id }, { $set: { status } }, { returnDocument: "after" }));
    return;
  }

  // Bumping the studio document makes two confirmations of the same studio conflict,
  // so MongoDB retries one of them and it sees the other's confirmed booking
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await studios.updateOne({ _id: booking.studioId }, { $inc: { bookingVersion: 1 } }, { session });
      const clash = await findConfirmedOverlap(booking.studioId, booking.start, booking.end, session);
      if (clash) {
        throw new HttpError(409, `This request overlaps a confirmed booking (${formatRange(clash.start, clash.end)}).`);
      }
      await bookings.updateOne({ _id, status: "Pending" }, { $set: { status: "Confirmed" } }, { session });
    });
  } finally {
    await session.endSession();
  }
  res.json(await bookings.findOne({ _id }));
}));

export default router;
