import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

// for chat purpose
export const sendMessage = async (req, res) => {
  try {
    // logged in user is sender id 
    const senderId = req.id;
    const receiverid = req.params.id;
    const {message} = req.body;
    
    // checking that is there any conversqation betiween sender and receiver 
    let conversation = await Conversation.findOne({participants: {$all: {senderId, receiverid}}})

    // establish the conversation if not started 
    if(!conversation){
        conversation = await Conversation.create({
            participants: [senderId, receiverid]
        })
    }
    const newMessage = await Message.create({
        senderId,
        receiverId,
        message
    })
    if(newMessage) conversation.messages.push(newMessage._id);

    // now we have to save both things 
    // await conversation.save();
    // await newMessage.save();

    // doing the same thing with promise.all()
    await Promise.all([conversation.save(), newMessage.save()]);

    // implementing socket.io for real time data transfer 
    // one to one messages 
    return res.status(200).json({
        message: "Message sent successfully",
        success: true,
        newMessage
    });
  } catch (error) {
    console.log(error);
  }
};

export const getMessages = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    const conversation = await Conversation.find({
      participants: {$all: [senderId, receiverId]}
    })
    if(!conversation) return res.status(404).json({
      message: "Conversation not found",
      success: false,
      message: []
    })
    res.status(200).json({
      message: "Conversation found",
      success: true,
      messages: conversation?.messages
    })
  } catch (error) {
    console.log(error);
  }
} 