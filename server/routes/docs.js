const auth = require("../middleware/auth");
const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const crypto = require("crypto");

/* =========================
   📄 GET all user documents
   ========================= */
router.get("/", auth, async (req, res) => {
  const docs = await Document.find({ owner: req.user.id })
    .sort({ updatedAt: -1 });

  res.json(docs);
});

/* =========================
   ➕ CREATE new document
   ========================= */
router.post("/", auth, async (req, res) => {
  try {
    const doc = await Document.create({
      _id: crypto.randomUUID(),
      data: "",
      owner: req.user.id,
      title: "Untitled Document",
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Create failed" });
  }
});

/* =========================
   📥 GET or CREATE document
   ========================= */
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;

  let document = await Document.findById(id);

  if (!document) {
    document = await Document.create({
      _id: id,
      data: "",
      owner: req.user.id,
    });
  }

  res.json(document);
});

/* =========================
   💾 UPDATE document
   ========================= */
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { data } = req.body;

  await Document.findByIdAndUpdate(id, { data });

  res.sendStatus(200);
});
/* =========================
   ✏️ RENAME document
========================= */
router.put("/:id/title", auth, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const updated = await Document.findByIdAndUpdate(
    id,
    { title },
    { new: true }
  );

  res.json(updated);
});
/**
 * GET all docs for logged user
 */
router.get("/", auth, async (req, res) => {
  const docs = await Document.find({ owner: req.user.id }).sort({ updatedAt: -1 });
  res.json(docs);
});

/**
 * DELETE doc
 */
router.delete("/:id", auth, async (req, res) => {
  await Document.findByIdAndDelete(req.params.id);
  res.sendStatus(200);
});

module.exports = router;