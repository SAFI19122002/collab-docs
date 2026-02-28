const auth = require("../middleware/auth");
const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const crypto = require("crypto");

/* =========================
   📄 GET all user documents
   ========================= */
router.get("/", auth, async (req, res) => {
  const docs = await Document.find({
    $or: [
      { owner: req.user.id },
      { collaborators: req.user.id }
    ]
  }).sort({ updatedAt: -1 });

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

  let document = await Document.findById(id).populate("owner", "name email");

  if (!document) {
    document = await Document.create({
      _id: id,
      data: "",
      owner: req.user.id,
      collaborators: []
    });
  } else {
    // Check if user is owner OR a collaborator
    const isOwner = document.owner._id.toString() === req.user.id;
    const isCollaborator = document.collaborators.includes(req.user.id);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ msg: "Not authorized to access this document" });
    }
  }

  res.json(document);
});

/* =========================
   💾 UPDATE document
   ========================= */
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { data, title } = req.body;

  const updateFields = { data };
  if (title !== undefined) updateFields.title = title;

  await Document.findByIdAndUpdate(id, updateFields);

  res.sendStatus(200);
});
/* =========================
   ✏️ RENAME document
   ========================= */
router.put("/:id/title", auth, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const updated = await Document.findOneAndUpdate(
    { _id: id, $or: [{ owner: req.user.id }, { collaborators: req.user.id }] },
    { title },
    { new: true }
  );

  if (!updated) return res.status(403).json({ msg: "Not authorized" });
  res.json(updated);
});

/* =========================
   📧 INVITE collaborator
   ========================= */
const User = require("../models/User"); // Need User model to lookup email

router.post("/:id/invite", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ msg: "Document not found" });
    }

    // Only owners can invite for now
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only the document owner can invite users" });
    }

    // Find the user to invite
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ msg: "User with this email not found" });
    }

    // Don't invite yourself
    if (userToInvite._id.toString() === req.user.id) {
      return res.status(400).json({ msg: "You are already the owner of this document" });
    }

    // Check if already a collaborator
    if (document.collaborators.includes(userToInvite._id)) {
      return res.status(400).json({ msg: "User is already a collaborator" });
    }

    document.collaborators.push(userToInvite._id);
    await document.save();

    res.json({ msg: "User successfully invited!", user: { name: userToInvite.name, email: userToInvite.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to invite user" });
  }
});

/**
 * DELETE doc
 */
router.delete("/:id", auth, async (req, res) => {
  const document = await Document.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!document) return res.status(403).json({ msg: "Not authorized to delete" });
  res.sendStatus(200);
});

module.exports = router;