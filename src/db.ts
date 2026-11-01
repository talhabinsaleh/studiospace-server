import { Collection, Db, Document, MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

export const BOOKING_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface Studio extends Document {
  title: string;
  category: string;
  hourlyRate: number;
  securityDeposit: number;
  maxCapacity: number;
  location: string;
  image: string;
  gallery: string[];
  amenities: string[];
  overview: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhoto?: string;
  rating: number;
  reviewCount: number;
  bookingVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking extends Document {
  studioId: ObjectId;
  studioTitle: string;
  studioImage: string;
  location: string;
  hostEmail: string;
  hostName: string;
  userEmail: string;
  userName: string;
  start: Date;
  end: Date;
  hours: number;
  guests: number;
  hourlyRate: number;
  securityDeposit: number;
  subtotal: number;
  total: number;
  status: BookingStatus;
  createdAt: Date;
}

export interface Review extends Document {
  studioId: ObjectId;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface WishlistItem extends Document {
  userEmail: string;
  studioId: ObjectId;
  createdAt: Date;
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

// One client per process, so serverless invocations reuse the same connection
export const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
const connection = client.connect();
let indexes: Promise<unknown> | null = null;

export async function getDb(): Promise<Db> {
  await connection;
  const db = client.db(process.env.DB_NAME || "studiospace");
  indexes ??= Promise.all([
    db.collection("studios").createIndex({ category: 1, rating: -1 }),
    db.collection("studios").createIndex({ ownerEmail: 1 }),
    db.collection("bookings").createIndex({ studioId: 1, status: 1, start: 1, end: 1 }),
    db.collection("bookings").createIndex({ userEmail: 1, start: -1 }),
    db.collection("reviews").createIndex({ studioId: 1, userEmail: 1 }, { unique: true }),
    db.collection("wishlist").createIndex({ userEmail: 1, studioId: 1 }, { unique: true }),
  ]);
  await indexes;
  return db;
}

export async function collections() {
  const db = await getDb();
  return {
    studios: db.collection<Studio>("studios") as Collection<Studio>,
    bookings: db.collection<Booking>("bookings") as Collection<Booking>,
    reviews: db.collection<Review>("reviews") as Collection<Review>,
    wishlist: db.collection<WishlistItem>("wishlist") as Collection<WishlistItem>,
  };
}
