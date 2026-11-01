import { Router } from "express";
import { collections } from "../db";
import { verifyToken } from "../middleware/auth";
import { asObjectId, HttpError, wrap } from "../utils";

const router = Router();
router.use(verifyToken);

router.get("/", wrap(async (req, res) => {
  const { wishlist } = await collections();
  const items = await wishlist
    .aggregate([
      { $match: { userEmail: req.user!.email } },
      { $sort: { createdAt: -1 } },
      { $lookup: { from: "studios", localField: "studioId", foreignField: "_id", as: "studio" } },
      { $unwind: "$studio" },
      { $replaceRoot: { newRoot: "$studio" } },
    ])
    .toArray();
  res.json(items);
}));

router.post("/:studioId", wrap(async (req, res) => {
  const { wishlist, studios } = await collections();
  const studioId = asObjectId(req.params.studioId);
  if (!(await studios.findOne({ _id: studioId }, { projection: { _id: 1 } }))) {
    throw new HttpError(404, "Studio not found.");
  }
  await wishlist.updateOne(
    { userEmail: req.user!.email, studioId },
    { $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  res.status(201).json({ saved: true });
}));

router.delete("/:studioId", wrap(async (req, res) => {
  const { wishlist } = await collections();
  await wishlist.deleteOne({ userEmail: req.user!.email, studioId: asObjectId(req.params.studioId) });
  res.json({ saved: false });
}));

export default router;
