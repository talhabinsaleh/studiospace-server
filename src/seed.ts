import { ObjectId } from "mongodb";
import { Booking, client, collections, Review, Studio } from "./db";

// Run with: npm run seed. It replaces studios, bookings, reviews and wishlist, but never touches user accounts.
if ((process.env.DB_NAME || "studiospace") !== "studiospace") {
  throw new Error("Seeding is only allowed on the studiospace database");
}

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=75&auto=format&fit=crop`;

const IMG = {
  cyc: photo("1471341971476-ae15ff5dd4ea"),
  lenses: photo("1516035069371-29a1b244cc32"),
  shooter: photo("1603574670812-d24560880210"),
  backlit: photo("1554048612-b6a482bc67e5"),
  clapper: photo("1485846234645-a62644f84728"),
  projector: photo("1478720568477-152d9b164e26"),
  theatre: photo("1524712245354-2c4e5e7121c0"),
  beam: photo("1535016120720-40c646be5580"),
  edit: photo("1492619375914-88005aa9e8fb"),
  timeline: photo("1574717024653-61fd2cf4d44d"),
  duo: photo("1559523161-0fc0d8b38a7a"),
  host: photo("1581368135153-a506cf13b1e1"),
  arm: photo("1590602847861-f357a9332bbc"),
  condenser: photo("1478737270239-2f02b77fc618"),
  monitor: photo("1589903308904-1010c2294adc"),
  control: photo("1598488035139-bdbb2231ce04"),
  synth: photo("1598653222000-6b7b7a552625"),
  guitars: photo("1511379938547-c1f69419868d"),
  drums: photo("1519892300165-cb5542fb47c7"),
  piano: photo("1520523839897-bd0b52f945a0"),
  paint: photo("1513364776144-60967b0f800f"),
  brushes: photo("1460661419201-fd4cecdf8a8b"),
  craft: photo("1452860606245-08befc0ff44b"),
  ceramics: photo("1565193566173-7a0ee3dbe261"),
  lounge: photo("1558403194-611308249627"),
};

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
    title: "Daylight Cyc Wall Loft",
    category: "Photo Studio",
    hourlyRate: 45,
    securityDeposit: 100,
    maxCapacity: 12,
    location: "Banani, Dhaka",
    image: IMG.cyc,
    gallery: [IMG.backlit, IMG.lenses],
    amenities: ["Cyc wall", "Strobe kit", "Softboxes", "Changing room", "Wi-Fi", "Freight lift"],
    overview:
      "A 1,400 sq ft loft built around a seamless white cyc wall. Six strobes, modifiers and C-stands are ready when you arrive, and the north windows give soft daylight until late afternoon. Popular for fashion lookbooks and product campaigns.",
  },
  {
    ...HOSTS.tanvir,
    title: "Blackbox Portrait Room",
    category: "Photo Studio",
    hourlyRate: 28,
    securityDeposit: 60,
    maxCapacity: 6,
    location: "Dhanmondi, Dhaka",
    image: IMG.shooter,
    gallery: [IMG.lenses, IMG.cyc],
    amenities: ["Black walls", "Continuous lights", "Paper backdrops", "Makeup mirror", "Wi-Fi"],
    overview:
      "A small matte-black room for portraits with full control over every shadow. Choose from eight paper backdrops and shoot tethered on the studio monitor. Ideal for headshots, actors' portfolios and moody editorial work.",
  },
  {
    ...HOSTS.nadia,
    title: "Tabletop Product Lab",
    category: "Photo Studio",
    hourlyRate: 22,
    securityDeposit: 40,
    maxCapacity: 4,
    location: "Agrabad, Chattogram",
    image: IMG.lenses,
    gallery: [IMG.backlit, IMG.shooter],
    amenities: ["Shooting table", "Light tent", "Macro rail", "Tethering station", "Wi-Fi"],
    overview:
      "Everything a small brand needs to shoot its own catalogue: a sweep table, light tent, macro rail and a tethered workstation. Reflectors and acrylic surfaces are included, so you only need to bring the products.",
  },
  {
    ...HOSTS.maya,
    title: "Stage One Sound Stage",
    category: "Film Stage",
    hourlyRate: 120,
    securityDeposit: 400,
    maxCapacity: 40,
    location: "Tejgaon, Dhaka",
    image: IMG.clapper,
    gallery: [IMG.beam, IMG.timeline],
    amenities: ["Soundproofing", "Lighting grid", "Green screen", "Loading dock", "Production office", "Parking"],
    overview:
      "A 4,000 sq ft acoustically treated stage with a full overhead lighting grid and a three-wall green screen. The loading dock opens directly onto the floor, and a production office and crew room sit just off set.",
  },
  {
    ...HOSTS.tanvir,
    title: "Reel Room Screening Stage",
    category: "Film Stage",
    hourlyRate: 85,
    securityDeposit: 250,
    maxCapacity: 30,
    location: "Uttara, Dhaka",
    image: IMG.theatre,
    gallery: [IMG.projector, IMG.beam],
    amenities: ["4K projector", "Tiered seating", "Surround sound", "Air conditioning", "Parking"],
    overview:
      "A private 30-seat screening room that doubles as a stage for interviews and panels. Use it for cast and crew screenings, festival previews and client presentations, with calibrated 4K projection and surround sound.",
  },
  {
    ...HOSTS.nadia,
    title: "Cutaway Edit and Insert Stage",
    category: "Film Stage",
    hourlyRate: 60,
    securityDeposit: 150,
    maxCapacity: 10,
    location: "Khulshi, Chattogram",
    image: IMG.edit,
    gallery: [IMG.timeline, IMG.clapper],
    amenities: ["Editing bay", "Color-calibrated monitor", "Insert table", "Soundproofing", "Wi-Fi"],
    overview:
      "A compact stage for pickups and insert shots with an editing bay in the same room. Shoot a take, check it on the calibrated monitor and reshoot straight away, which keeps small crews moving quickly.",
  },
  {
    ...HOSTS.maya,
    title: "The Long Table Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 35,
    securityDeposit: 50,
    maxCapacity: 6,
    location: "Gulshan, Dhaka",
    image: IMG.duo,
    gallery: [IMG.arm, IMG.condenser],
    amenities: ["4 dynamic mics", "Multitrack recorder", "3 camera angles", "Ring lights", "Wi-Fi"],
    overview:
      "A warm brick-walled room with a four-seat table, boom-mounted mics and three cameras already framed. Walk in, sit down and record, then leave with separate audio tracks and video angles on your own drive.",
  },
  {
    ...HOSTS.tanvir,
    title: "Solo Booth Studio",
    category: "Podcast Lounge",
    hourlyRate: 18,
    securityDeposit: 25,
    maxCapacity: 2,
    location: "Mirpur, Dhaka",
    image: IMG.host,
    gallery: [IMG.monitor, IMG.arm],
    amenities: ["Vocal booth", "Condenser mic", "Audio interface", "Headphones", "Wi-Fi"],
    overview:
      "A quiet treated booth for solo shows, voiceovers and audiobook narration. The microphone and interface are set up and tested before each session, so you can begin recording within minutes of arriving.",
  },
  {
    ...HOSTS.nadia,
    title: "Fireside Talk Room",
    category: "Podcast Lounge",
    hourlyRate: 30,
    securityDeposit: 50,
    maxCapacity: 5,
    location: "Sylhet Sadar, Sylhet",
    image: IMG.arm,
    gallery: [IMG.condenser, IMG.duo],
    amenities: ["Soft seating", "3 dynamic mics", "Video switcher", "Acoustic panels", "Refreshments"],
    overview:
      "Armchairs, low lamps and carefully hidden acoustic panels make this room feel like a living room rather than a studio. Guests relax quickly, and the conversations sound better for it.",
  },
  {
    ...HOSTS.maya,
    title: "Analog Dreams Control Suite",
    category: "Music Suite",
    hourlyRate: 75,
    securityDeposit: 200,
    maxCapacity: 8,
    location: "Banani, Dhaka",
    image: IMG.control,
    gallery: [IMG.synth, IMG.guitars],
    amenities: ["Mixing console", "Outboard gear", "Guitar wall", "Studio monitors", "Engineer on request"],
    overview:
      "A tuned control room with a mixing console, a rack of outboard gear and a wall of guitars to borrow. Track, overdub or mix here, and book the in-house engineer if you would rather focus on the performance.",
  },
  {
    ...HOSTS.tanvir,
    title: "Live Room Drum Suite",
    category: "Music Suite",
    hourlyRate: 55,
    securityDeposit: 120,
    maxCapacity: 7,
    location: "Mohakhali, Dhaka",
    image: IMG.drums,
    gallery: [IMG.piano, IMG.control],
    amenities: ["Drum kit", "Isolation room", "16 mic inputs", "Upright piano", "Air conditioning"],
    overview:
      "A high-ceilinged live room with a miked drum kit, an upright piano and an isolation room for amps. Bands can record together with clean separation, or simply use it as a good-sounding rehearsal space.",
  },
  {
    ...HOSTS.nadia,
    title: "Keys and Strings Writing Room",
    category: "Music Suite",
    hourlyRate: 26,
    securityDeposit: 50,
    maxCapacity: 4,
    location: "Zindabazar, Sylhet",
    image: IMG.guitars,
    gallery: [IMG.piano, IMG.synth],
    amenities: ["Acoustic guitars", "MIDI keyboard", "Natural light", "Audio interface", "Wi-Fi"],
    overview:
      "A sunlit songwriting room with acoustic guitars, a weighted keyboard and a simple recording setup for capturing demos. It is a calm place to write, away from the pressure of a full studio session.",
  },
  {
    ...HOSTS.maya,
    title: "Pigment Painting Atelier",
    category: "Workshop",
    hourlyRate: 20,
    securityDeposit: 40,
    maxCapacity: 14,
    location: "Dhanmondi, Dhaka",
    image: IMG.paint,
    gallery: [IMG.brushes, IMG.ceramics],
    amenities: ["Easels", "Utility sink", "Natural light", "Drying racks", "Wi-Fi"],
    overview:
      "A bright atelier with fourteen easels, a deep sink and drying racks along one wall. Artists rent it for personal projects, and teachers use it for weekend classes because cleanup is so easy.",
  },
  {
    ...HOSTS.tanvir,
    title: "Paper and Print Makers Room",
    category: "Workshop",
    hourlyRate: 24,
    securityDeposit: 60,
    maxCapacity: 10,
    location: "Lalmatia, Dhaka",
    image: IMG.craft,
    gallery: [IMG.brushes, IMG.lounge],
    amenities: ["Cutting tables", "Screen-print press", "Paper cutter", "Storage shelves", "Wi-Fi"],
    overview:
      "Large cutting tables and a four-color screen-print press make this room a favourite for zine makers and small merchandise runs. Basic inks and cutting mats are included with every booking.",
  },
  {
    ...HOSTS.nadia,
    title: "Quiet Clay Ceramics Workshop",
    category: "Workshop",
    hourlyRate: 32,
    securityDeposit: 80,
    maxCapacity: 8,
    location: "Nasirabad, Chattogram",
    image: IMG.ceramics,
    gallery: [IMG.lounge, IMG.paint],
    amenities: ["Pottery wheels", "Kiln access", "Glazing station", "Utility sink", "Refreshments"],
    overview:
      "Four pottery wheels, a glazing station and kiln access in a calm, plaster-walled room. Host a small class or settle in for a long session of your own. Firing can be arranged with the host after booking.",
  },
];

const REVIEW_LINES = [
  { name: "Farhan Ahmed", rating: 5, comment: "The room was ready when we arrived and the host helped us adjust the setup. We finished the shoot an hour early." },
  { name: "Sadia Noor", rating: 5, comment: "Great light, clean space and honest pricing. The deposit came back the very next morning." },
  { name: "Rafi Chowdhury", rating: 4, comment: "Everything listed was there and worked well. Parking nearby was a little tight, but I would still book it again." },
  { name: "Ishita Das", rating: 5, comment: "Exactly what the photos showed. Our guests were comfortable, and the recording came out very clean." },
  { name: "Arif Hossain", rating: 4, comment: "A solid space with a friendly host. Bring your own adapters if you use unusual connectors." },
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
      note: "",
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
    makeBooking(find("Daylight Cyc Wall Loft"), at(5, 6), 4, "Confirmed", other),
    makeBooking(find("Daylight Cyc Wall Loft"), at(6, 6), 3, "Pending", creator),
    makeBooking(find("Stage One Sound Stage"), at(9, 4), 6, "Pending", other),
    makeBooking(find("Analog Dreams Control Suite"), at(-12, 8), 5, "Completed", other),
    // The demo creator's bookings, one for each status
    makeBooking(find("Solo Booth Studio"), at(3, 8), 2, "Confirmed", creator),
    makeBooking(find("Live Room Drum Suite"), at(12, 10), 3, "Pending", creator),
    makeBooking(find("Blackbox Portrait Room"), at(-20, 6), 2, "Completed", creator),
    makeBooking(find("Tabletop Product Lab"), at(-8, 7), 2, "Cancelled", creator),
  ]);

  console.log(`Seeded ${docs.length} studios, 8 bookings and ${docs.flatMap((d) => d.reviews).length} reviews.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
