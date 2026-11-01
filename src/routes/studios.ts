import { Router } from "express";
import { Filter, ObjectId, Sort } from "mongodb";
import { collections, Studio } from "../db";
import { verifyToken } from "../middleware/auth";
import { asObjectId, cleanUrl, escapeRegex, HttpError, wrap } from "../utils";

export const CATEGORIES = ["Photo Studio", "Film Stage", "Podcast Lounge", "Music Suite", "Workshop"];

const router = Router();

// Throws a 400 with a clear message when the submitted studio is not valid
function parseStudio(body: Record<string, unknown>) {
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");
  const title = text("title");
  const category = text("category");
  const location = text("location");
  const overview = text("overview");
  const hourlyRate = Number(body.hourlyRate);
  const securityDeposit = Number(body.securityDeposit);
  const maxCapacity = Number(body.maxCapacity);
  const image = cleanUrl(body.image);
  const amenities = Array.isArray(body.amenities)
    ? [...new Set(body.amenities.map(String).map((a) => a.trim()).filter(Boolean))]
    : [];
  const gallery = Array.isArray(body.gallery)
    ? body.gallery.map(cleanUrl).filter((url): url is string => Boolean(url))
    : [];

  if (title.length < 4) throw new HttpError(400, "Title must have at least 4 characters.");
  if (!CATEGORIES.includes(category)) throw new HttpError(400, "Please choose a valid category.");
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new HttpError(400, "Hourly rate must be more than 0.");
  if (!Number.isFinite(securityDeposit) || securityDeposit < 0) throw new HttpError(400, "Security deposit cannot be negative.");
  if (!Number.isInteger(maxCapacity) || maxCapacity < 1) throw new HttpError(400, "Max capacity must be at least 1.");
  if (!location) throw new HttpError(400, "Location is required.");
  if (!image) throw new HttpError(400, "A valid image URL is required.");
  if (amenities.length === 0) throw new HttpError(400, "Add at least one amenity.");
  if (overview.length < 20) throw new HttpError(400, "Overview must have at least 20 characters.");

  return { title, category, hourlyRate, securityDeposit, maxCapacity, location, image, gallery, amenities, overview };
}

router.get("/", wrap(async (req, res) => {
  const { studios } = await collections();
  const { search, category, minPrice, maxPrice, minRating, capacity, amenity, sort } = req.query;
  const filter: Filter<Studio> = {};

  if (typeof search === "string" && search.trim()) {
    const pattern = { $regex: escapeRegex(search.trim()), $options: "i" };
    filter.$or = [{ title: pattern }, { location: pattern }, { amenities: pattern }];
  }
  if (typeof category === "string" && category) {
    filter.category = { $in: category.split(",") };
  }
  const min = Number(minPrice);
  const max = Number(maxPrice);
  const price: { $gte?: number; $lte?: number } = {};
  if (minPrice && Number.isFinite(min)) price.$gte = min;
  if (maxPrice && Number.isFinite(max)) price.$lte = max;
  if (Object.keys(price).length > 0) filter.hourlyRate = price;
  if (minRating && Number.isFinite(Number(minRating))) filter.rating = { $gte: Number(minRating) };
  if (capacity && Number.isFinite(Number(capacity))) filter.maxCapacity = { $gte: Number(capacity) };
  if (typeof amenity === "string" && amenity) filter.amenities = { $all: amenity.split(",") };

  const sorts: Record<string, Sort> = {
    newest: { createdAt: -1, _id: -1 },
    "price-asc": { hourlyRate: 1, _id: 1 },
    "price-desc": { hourlyRate: -1, _id: 1 },
    rating: { rating: -1, reviewCount: -1, _id: 1 },
  };
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));

  const [items, total] = await Promise.all([
    studios
      .find(filter)
      .sort(sorts[String(sort)] ?? sorts.rating)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    studios.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.get("/featured", wrap(async (_req, res) => {
  const { studios } = await collections();
  res.json(await studios.find().sort({ rating: -1, createdAt: -1 }).limit(6).toArray());
}));

router.get("/categories", wrap(async (_req, res) => {
  const { studios } = await collections();
  const counts = await studios
    .aggregate<{ _id: string; count: number; minRate: number }>([
      { $group: { _id: "$category", count: { $sum: 1 }, minRate: { $min: "$hourlyRate" } } },
    ])
    .toArray();
  res.json(counts);
}));

router.get("/mine", verifyToken, wrap(async (req, res) => {
  const { studios } = await collections();
  res.json(await studios.find({ ownerEmail: req.user!.email }).sort({ createdAt: -1 }).toArray());
}));

router.get("/:id", wrap(async (req, res) => {
  const { studios } = await collections();
  const studio = await studios.findOne({ _id: asObjectId(req.params.id) });
  if (!studio) throw new HttpError(404, "Studio not found.");
  res.json(studio);
}));

// Confirmed slots in the requested range, so the booking modal can show what is already taken
router.get("/:id/availability", wrap(async (req, res) => {
  const { bookings } = await collections();
  const from = new Date(String(req.query.from));
  const to = new Date(String(req.query.to));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new HttpError(400, "A valid from and to date are required.");
  }
  const slots = await bookings
    .find(
      { studioId: asObjectId(req.params.id), status: "Confirmed", start: { $lt: to }, end: { $gt: from } },
      { projection: { start: 1, end: 1, _id: 0 } },
    )
    .sort({ start: 1 })
    .toArray();
  res.json(slots);
}));

router.post("/", verifyToken, wrap(async (req, res) => {
  const { studios } = await collections();
  const data = parseStudio(req.body);
  const now = new Date();
  const doc: Studio = {
    ...data,
    ownerEmail: req.user!.email,
    ownerName: req.user!.name,
    ownerPhoto: req.user!.picture,
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const result = await studios.insertOne(doc);
  res.status(201).json({ ...doc, _id: result.insertedId });
}));

// The owner email comes from the verified token, never from the request body
router.put("/:id", verifyToken, wrap(async (req, res) => {
  const { studios } = await collections();
  const _id = asObjectId(req.params.id);
  const existing = await studios.findOne({ _id });
  if (!existing) throw new HttpError(404, "Studio not found.");
  if (existing.ownerEmail !== req.user!.email) throw new HttpError(403, "You can only update your own studios.");
  const updated = await studios.findOneAndUpdate(
    { _id },
    { $set: { ...parseStudio(req.body), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  res.json(updated);
}));

router.delete("/:id", verifyToken, wrap(async (req, res) => {
  const { studios, bookings, reviews, wishlist } = await collections();
  const _id = asObjectId(req.params.id);
  const existing = await studios.findOne({ _id });
  if (!existing) throw new HttpError(404, "Studio not found.");
  if (existing.ownerEmail !== req.user!.email) throw new HttpError(403, "You can only delete your own studios.");
  const upcoming = await bookings.countDocuments({ studioId: _id, status: "Confirmed", end: { $gt: new Date() } });
  if (upcoming > 0) {
    throw new HttpError(409, "This studio has upcoming confirmed bookings. Cancel them before deleting it.");
  }
  await Promise.all([
    studios.deleteOne({ _id }),
    reviews.deleteMany({ studioId: _id }),
    wishlist.deleteMany({ studioId: _id }),
    bookings.updateMany({ studioId: _id, status: "Pending" }, { $set: { status: "Cancelled" } }),
  ]);
  res.json({ message: "Studio deleted." });
}));

router.get("/:id/reviews", wrap(async (req, res) => {
  const { reviews } = await collections();
  res.json(await reviews.find({ studioId: asObjectId(req.params.id) }).sort({ createdAt: -1 }).toArray());
}));

router.post("/:id/reviews", verifyToken, wrap(async (req, res) => {
  const { studios, bookings, reviews } = await collections();
  const studioId = asObjectId(req.params.id);
  const rating = Number(req.body.rating);
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, "Rating must be from 1 to 5.");
  if (comment.length < 10) throw new HttpError(400, "Review must have at least 10 characters.");

  const hasBooked = await bookings.findOne({
    studioId,
    userEmail: req.user!.email,
    status: { $in: ["Confirmed", "Completed"] },
  });
  if (!hasBooked) throw new HttpError(403, "Only creators with a confirmed booking can review this studio.");

  await reviews.updateOne(
    { studioId, userEmail: req.user!.email },
    {
      $set: { rating, comment, userName: req.user!.name, userPhoto: req.user!.picture, createdAt: new Date() },
    },
    { upsert: true },
  );
  await refreshRating(studioId);
  res.status(201).json({ message: "Review saved." });
}));

export async function refreshRating(studioId: ObjectId) {
  const { studios, reviews } = await collections();
  const [stats] = await reviews
    .aggregate<{ avg: number; count: number }>([
      { $match: { studioId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    .toArray();
  await studios.updateOne(
    { _id: studioId },
    { $set: { rating: stats ? Math.round(stats.avg * 10) / 10 : 0, reviewCount: stats?.count ?? 0 } },
  );
}

export default router;
