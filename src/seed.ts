import { ObjectId } from "mongodb";
import { Booking, client, collections, Review, Studio } from "./db";

// Run with: npm run seed. It replaces studios, bookings, reviews and wishlist, but never touches user accounts.
if ((process.env.DB_NAME || "studiospace") !== "studiospace") {
  throw new Error("Seeding is only allowed on the studiospace database");
}

const photo = (name: string) => `https://studiospace-talha.vercel.app/photos/${name}.jpg`;

const HOSTS = {
  maya: { ownerEmail: "host@studiospace.demo", ownerName: "Maya Rahman" },
  tanvir: { ownerEmail: "tanvir@studiospace.demo", ownerName: "Tanvir Hasan" },
  nadia: { ownerEmail: "nadia@studiospace.demo", ownerName: "Nadia Karim" },
};

type Seed = Pick<
  Studio,
  "title" | "category" | "hourlyRate" | "securityDeposit" | "maxCapacity" | "location" | "image" | "gallery" | "amenities" | "overview" | "ownerEmail" | "ownerName"
>;

const STUDIOS: Seed[] = [
  {
    ...HOSTS.maya,
    title: "Daylight Softbox Loft",
    category: "Photo Studio",
    hourlyRate: 45,
    securityDeposit: 100,
    maxCapacity: 12,
    location: "Banani, Dhaka",
    image: photo("softbox-loft"),
    gallery: [photo("gear-ring"), photo("vintage-camera")],
    amenities: ["Softboxes", "Strobe kit", "Light stands", "Changing room", "Wi-Fi", "Freight lift"],
    overview:
      "North windows on one side and a rack of softboxes on the other, so you can mix daylight and flash without moving your set. Fashion teams like it for lookbooks because the changing room is right beside the floor.",
  },
  {
    ...HOSTS.tanvir,
    title: "Timber Floor Portrait Room",
    category: "Photo Studio",
    hourlyRate: 28,
    securityDeposit: 60,
    maxCapacity: 6,
    location: "Dhanmondi, Dhaka",
    image: photo("timber-portrait"),
    gallery: [photo("gear-ring"), photo("softbox-loft")],
    amenities: ["Hardwood floor", "Softbox", "Paper backdrops", "Makeup mirror", "Wi-Fi"],
    overview:
      "A warm wooden floor gives portraits an honest, lived-in look that a white sweep never will. It suits actor headshots and small family sessions, and there are eight paper backdrops if you do want a plain wall.",
  },
  {
    ...HOSTS.nadia,
    title: "Tabletop Product Lab",
    category: "Photo Studio",
    hourlyRate: 22,
    securityDeposit: 40,
    maxCapacity: 4,
    location: "Agrabad, Chattogram",
    image: photo("tabletop-lab"),
    gallery: [photo("vintage-camera"), photo("gear-ring")],
    amenities: ["Shooting table", "Overhead light", "Macro rail", "Tethering station", "Wi-Fi"],
    overview:
      "Built for small shops that shoot their own catalogue. The table, overhead light and tethered screen stay set up between bookings, so you can shoot a hundred products in an afternoon. Bring the products and nothing else.",
  },
  {
    ...HOSTS.maya,
    title: "Stage One Sound Stage",
    category: "Film Stage",
    hourlyRate: 120,
    securityDeposit: 400,
    maxCapacity: 40,
    location: "Tejgaon, Dhaka",
    image: photo("empty-stage"),
    gallery: [photo("stage-door"), photo("broadcast-camera")],
    amenities: ["Clear floor", "High ceiling", "Roll-up door", "Production office", "Parking"],
    overview:
      "A big empty box, and that is the point. Trucks can drive right up to the roll-up door, the floor is clear, and the ceiling is high enough to build a two-storey set for a commercial or music video.",
  },
  {
    ...HOSTS.tanvir,
    title: "Reel Room Broadcast Stage",
    category: "Film Stage",
    hourlyRate: 85,
    securityDeposit: 250,
    maxCapacity: 30,
    location: "Uttara, Dhaka",
    image: photo("broadcast-camera"),
    gallery: [photo("field-camera"), photo("stage-door")],
    amenities: ["Broadcast camera", "Headset system", "Lighting rig", "Air conditioning", "Parking"],
    overview:
      "Set up for live-to-tape work such as panels, product launches and streamed events. The camera position and talkback headsets are already wired, which saves a small crew most of a morning.",
  },
  {
    ...HOSTS.nadia,
    title: "Cutaway Green Screen Stage",
    category: "Film Stage",
    hourlyRate: 60,
    securityDeposit: 150,
    maxCapacity: 10,
    location: "Khulshi, Chattogram",
    image: photo("green-screen"),
    gallery: [photo("field-camera"), photo("broadcast-camera")],
    amenities: ["Green screen", "Even lighting", "Camera support", "Soundproofing", "Wi-Fi"],
    overview:
      "A lit green wall ready for interviews, explainers and quick visual effects shots. The lighting is already evened out, so your keying stays clean and a two-person team can manage the whole shoot.",
  },
  {
    ...HOSTS.maya,
    title: "The Round Table Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 35,
    securityDeposit: 50,
    maxCapacity: 6,
    location: "Gulshan, Dhaka",
    image: photo("round-table"),
    gallery: [photo("panel-room"), photo("solo-mic")],
    amenities: ["4 boom mics", "Multitrack recorder", "Round table", "Acoustic panels", "Wi-Fi"],
    overview:
      "A round table means everyone can see each other, and conversations flow better for it. Four mics on boom arms record to separate tracks, and you leave with the files on your own drive.",
  },
  {
    ...HOSTS.tanvir,
    title: "Solo Mic Voice Room",
    category: "Podcast Lounge",
    hourlyRate: 18,
    securityDeposit: 25,
    maxCapacity: 2,
    location: "Mirpur, Dhaka",
    image: photo("solo-mic"),
    gallery: [photo("desk-mic"), photo("desk-mixer")],
    amenities: ["Broadcast mic", "Audio interface", "Headphones", "Acoustic panels", "Wi-Fi"],
    overview:
      "A small treated room for solo shows, voiceovers and audiobook narration. The mic and interface are tested before every session, so you can be recording within five minutes of walking in.",
  },
  {
    ...HOSTS.nadia,
    title: "Panel Room Talk Studio",
    category: "Podcast Lounge",
    hourlyRate: 30,
    securityDeposit: 50,
    maxCapacity: 5,
    location: "Sylhet Sadar, Sylhet",
    image: photo("panel-room"),
    gallery: [photo("long-desk"), photo("desk-mixer")],
    amenities: ["Bright windows", "3 boom mics", "Acoustic panels", "Video switcher", "Refreshments"],
    overview:
      "Most podcast rooms feel like caves. This one has big windows and colourful acoustic panels, so guests relax and it looks good on camera if you also publish video episodes.",
  },
  {
    ...HOSTS.maya,
    title: "Analog Dreams Control Suite",
    category: "Music Suite",
    hourlyRate: 75,
    securityDeposit: 200,
    maxCapacity: 8,
    location: "Banani, Dhaka",
    image: photo("control-suite"),
    gallery: [photo("big-console"), photo("keys-corner")],
    amenities: ["Mixing desk", "Studio monitors", "Tuned room", "Outboard gear", "Engineer on request"],
    overview:
      "A properly tuned control room with monitors you can trust. Bring your session to mix or overdub, and book the in-house engineer if you would rather concentrate on the music than the patch bay.",
  },
  {
    ...HOSTS.tanvir,
    title: "Live Room Drum Suite",
    category: "Music Suite",
    hourlyRate: 55,
    securityDeposit: 120,
    maxCapacity: 7,
    location: "Mohakhali, Dhaka",
    image: photo("drum-room"),
    gallery: [photo("stone-live-room"), photo("big-console")],
    amenities: ["Miked drum kit", "Isolation room", "16 mic inputs", "Cymbal set", "Air conditioning"],
    overview:
      "The kit is already miked, tuned and sitting in a room that flatters it. Bands can track together with amps in the isolation room, or a drummer can knock out a full album of parts in one long day.",
  },
  {
    ...HOSTS.nadia,
    title: "Grand Piano Writing Room",
    category: "Music Suite",
    hourlyRate: 26,
    securityDeposit: 50,
    maxCapacity: 4,
    location: "Zindabazar, Sylhet",
    image: photo("piano-room"),
    gallery: [photo("keys-corner"), photo("stone-live-room")],
    amenities: ["Grand piano", "Wood panelling", "Stereo mics", "Audio interface", "Wi-Fi"],
    overview:
      "A wood-panelled room built around a grand piano, with a simple stereo pair ready for capturing ideas. It is a calm place for writing, teaching a private lesson or recording a solo piece.",
  },
  {
    ...HOSTS.maya,
    title: "Terracotta Wheel Room",
    category: "Workshop",
    hourlyRate: 20,
    securityDeposit: 40,
    maxCapacity: 14,
    location: "Dhanmondi, Dhaka",
    image: photo("clay-wheel"),
    gallery: [photo("green-pots"), photo("hand-shaping")],
    amenities: ["Pottery wheels", "Clay store", "Drying racks", "Utility sink", "Wi-Fi"],
    overview:
      "A busy, earthy room inspired by the potters of rural Bangladesh. Teachers rent it for weekend classes because everything from clay to drying space is on hand and cleaning up afterwards is easy.",
  },
  {
    ...HOSTS.tanvir,
    title: "Hand Shaping Bench",
    category: "Workshop",
    hourlyRate: 24,
    securityDeposit: 60,
    maxCapacity: 10,
    location: "Lalmatia, Dhaka",
    image: photo("hand-shaping"),
    gallery: [photo("clay-wheel"), photo("green-pots")],
    amenities: ["Long benches", "Hand tools", "Slab roller", "Storage shelves", "Wi-Fi"],
    overview:
      "Long benches and good tools for hand-building, with no wheel experience needed. It works well for team outings and beginner groups, and basic clay and tools are included with every booking.",
  },
  {
    ...HOSTS.nadia,
    title: "Quiet Clay Ceramics Workshop",
    category: "Workshop",
    hourlyRate: 32,
    securityDeposit: 80,
    maxCapacity: 8,
    location: "Nasirabad, Chattogram",
    image: photo("green-pots"),
    gallery: [photo("hand-shaping"), photo("clay-wheel")],
    amenities: ["Glazing station", "Kiln access", "Pottery wheels", "Utility sink", "Refreshments"],
    overview:
      "Glazing tables and kiln access for people who are past the beginner stage. Host a small class or settle in for a long solo session, and arrange firing times with your host after you book.",
  },
];

const REVIEW_LINES = [
  { name: "Farhan Ahmed", rating: 5, comment: "Everything was switched on and ready when we walked in. We wrapped an hour ahead of schedule and still got every shot." },
  { name: "Sadia Noor", rating: 5, comment: "The price on the page was the price I paid, and my deposit came back the next morning. That rarely happens." },
  { name: "Rafi Chowdhury", rating: 4, comment: "The room matched the listing and the gear worked well. Parking nearby is tight, so come early or take a rickshaw." },
  { name: "Ishita Das", rating: 5, comment: "Our guests settled in straight away, and the host checked on us twice without getting in the way. Lovely space." },
  { name: "Arif Hossain", rating: 4, comment: "A solid room with a friendly owner. Bring your own adapters if you use anything unusual, and you will be fine." },
];

function at(daysFromNow: number, hour: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  const { studios, bookings, reviews, wishlist } = await collections();
  await Promise.all([studios.deleteMany({}), bookings.deleteMany({}), reviews.deleteMany({}), wishlist.deleteMany({})]);

  const now = Date.now();
  const docs = STUDIOS.map((studio, index) => {
    const lines = [0, 1, 2, 3, 4].map((n) => REVIEW_LINES[(index + n) % REVIEW_LINES.length]).slice(0, 2 + (index % 3));
    const rating = lines.reduce((sum, line) => sum + line.rating, 0) / lines.length;
    const createdAt = new Date(now - (index + 1) * 86_400_000);
    const _id = new ObjectId();
    return {
      studio: {
        ...studio,
        _id,
        rating: Math.round(rating * 10) / 10,
        reviewCount: lines.length,
        createdAt,
        updatedAt: createdAt,
      } as Studio,
      reviews: lines.map(
        (line, n): Review => ({
          studioId: _id,
          userEmail: `${line.name.split(" ")[0].toLowerCase()}@studiospace.demo`,
          userName: line.name,
          rating: line.rating,
          comment: line.comment,
          createdAt: new Date(now - (n + 1) * 5 * 86_400_000),
        }),
      ),
    };
  });
  await studios.insertMany(docs.map((d) => d.studio));
  await reviews.insertMany(docs.flatMap((d) => d.reviews));

  const makeBooking = (studio: Studio, start: Date, hours: number, status: Booking["status"], who: { email: string; name: string }): Booking => {
    const subtotal = studio.hourlyRate * hours;
    return {
      studioId: studio._id as ObjectId,
      studioTitle: studio.title,
      studioImage: studio.image,
      location: studio.location,
      hostEmail: studio.ownerEmail,
      hostName: studio.ownerName,
      userEmail: who.email,
      userName: who.name,
      start,
      end: new Date(start.getTime() + hours * 3_600_000),
      hours,
      guests: 2,
      hourlyRate: studio.hourlyRate,
      securityDeposit: studio.securityDeposit,
      subtotal,
      total: subtotal + studio.securityDeposit,
      status,
      createdAt: new Date(now - 2 * 86_400_000),
    };
  };

  const creator = { email: "creator@studiospace.demo", name: "Rayan Islam" };
  const other = { email: "farhan@studiospace.demo", name: "Farhan Ahmed" };
  const find = (title: string) => docs.find((d) => d.studio.title === title)!.studio;

  await bookings.insertMany([
    // Requests the demo host can confirm, and a slot that shows double-booking prevention
    makeBooking(find("Daylight Softbox Loft"), at(5, 6), 4, "Confirmed", other),
    makeBooking(find("Daylight Softbox Loft"), at(6, 6), 3, "Pending", creator),
    makeBooking(find("Stage One Sound Stage"), at(9, 4), 6, "Pending", other),
    makeBooking(find("Analog Dreams Control Suite"), at(-12, 8), 5, "Completed", other),
    // The demo creator's bookings, one for each status
    makeBooking(find("Solo Mic Voice Room"), at(3, 8), 2, "Confirmed", creator),
    makeBooking(find("Live Room Drum Suite"), at(12, 10), 3, "Pending", creator),
    makeBooking(find("Timber Floor Portrait Room"), at(-20, 6), 2, "Completed", creator),
    makeBooking(find("Tabletop Product Lab"), at(-8, 7), 2, "Cancelled", creator),
  ]);

  console.log(`Seeded ${docs.length} studios, 8 bookings and ${docs.flatMap((d) => d.reviews).length} reviews.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
