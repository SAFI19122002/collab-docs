const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema(
  {
    _id: String,

    title: {
      type: String,
      default: "Untitled Document",
    },

    data: {
      type: String,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);