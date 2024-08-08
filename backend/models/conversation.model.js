import mongoose from "mongoose";

// conversation means who are participants of the chat
// we have to keep the participants, bcoz we have to get the messages between two people only
const conversationSchema = new mongoose.Schema({
  // participants can be multiple
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  message: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
});

export const Conversation = mongoose.model("Conversation", conversationSchema);
