import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comments.model.js";
import { User } from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;

    const loggedInUserId = req.id;
    if (!image) {
      return res
        .status(400)
        .json({ message: "Image required", success: false });
    }

    // image upload
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    // buffer to data uri
    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;

    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: loggedInUserId,
    });

    // add all posts to logged in user's post array
    const user = await User.findById(loggedInUserId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({ path: "author", select: "-password" });
    return res.status(200).json({
      message: "New post added",
      success: true,
      post,
    });
  } catch (error) {
    console.log(error);
  }
};

export const allPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "author", select: "username profilePicture" })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });

    return res
      .status(200)
      .json({ message: "Posts fetched successfully", success: true, posts });
  } catch (error) {
    console.log(error);
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const { userId } = req.id;
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username profilePicture",
      })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });

    return res
      .status(200)
      .json({ message: "Posts fetched successfully", success: true, posts });
  } catch (error) {
    console.log(error);
  }
};

export const likePost = async (req, res) => {
  try {
    const { likeKrneWaleUserKiId } = req.id;
    const  postId  = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Cannot find post",
        success: false,
      });
    }

    // add to set is used to keep things unique
    await post.updateOne({ $addToSet: { likes: likeKrneWaleUserKiId } });
    await post.save();

    // implement socket io for real time noticification
    const user = await User.findById(likeKrneWaleUserKiId).select(
      "username profilePicture"
    );

    const postOwneId = post.author.toString();
    if (postOwneId !== likeKrneWaleUserKiId) {
      //emit notification event
      const notification = {
        type: "like",
        userId: likeKrneWaleUserKiId,
        userDetails: user,
        postId,
        message: "Your post was liked",
      };
      const postOwnerSocketId = getReceiverSocketId(postOwneId);
      io.to(postOwnerSocketId).emit("notification", notification);
    }

    return res
      .status(200)
      .json({ message: "Posts liked successfully", success: true, post });
  } catch (error) {
    console.log(error);
  }
};

export const disLikePost = async (req, res) => {
  try {
    const { likeKrneWaleUserKiId } = req.id;
    const postId  = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Cannot find post",
        success: false,
      });
    }

    // add to set is used to keep things unique
    await post.updateOne({ $pull: { likes: likeKrneWaleUserKiId } });
    await post.save();

    // implement socket io for real time noticification
    const user = await User.findById(likeKrneWaleUserKiId).select(
      "username profilePicture"
    );

    const postOwneId = post.author.toString();
    if (postOwneId !== likeKrneWaleUserKiId) {
      //emit notification event
      const notification = {
        type: "dislike",
        userId: likeKrneWaleUserKiId,
        userDetails: user,
        postId,
        message: "Your post was liked",
      };
      const postOwnerSocketId = getReceiverSocketId(postOwneId);
      io.to(postOwnerSocketId).emit("notification", notification);
    }

    return res
      .status(200)
      .json({ message: "Posts disliked successfully", success: true, post });
  } catch (error) {
    console.log(error);
  }
};

export const addComment = async (req,res) =>{
  try {
      const postId = req.params.id;
      const commentKrneWalaUserKiId = req.id;

      const {text} = req.body;

      const post = await Post.findById(postId);

      if(!text) return res.status(400).json({message:'text is required', success:false});

      const comment = await Comment.create({
          text,
          author:commentKrneWalaUserKiId,
          post:postId
      })

      await comment.populate({
          path:'author',
          select:"username profilePicture"
      });
      
      post.comments.push(comment._id);
      await post.save();

      return res.status(201).json({
          message:'Comment Added',
          comment,
          success:true
      })

  } catch (error) {
      console.log(error);
  }
};

export const getCommentsRelatedToPost = async (req, res) => {
  try {
    const { postId } = req.params.id;
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username profilePicture"
    );
    if (!comments) {
      return res.status(404).json({
        success: false,
        message: "No comments found for this post",
      });
    }

    return res.status(200).json({
      message: "Comments fetched",
      success: true,
      comments,
    });
  } catch (error) {
    console.log(error);
  }
};

export const deletePost = async (req,res) => {
  try {
      const postId = req.params.id;
      const authorId = req.id;

      const post = await Post.findById(postId);
      if(!post) return res.status(404).json({message:'Post not found', success:false});

      // check if the logged-in user is the owner of the post
      if(post.author.toString() !== authorId) return res.status(403).json({message:'Unauthorized'});

      // delete post
      await Post.findByIdAndDelete(postId);

      // remove the post id from the user's post
      let user = await User.findById(authorId);
      user.posts = user.posts.filter(id => id.toString() !== postId);
      await user.save();

      // delete associated comments
      await Comment.deleteMany({post:postId});

      return res.status(200).json({
          success:true,
          message:'Post deleted'
      })

  } catch (error) {
      console.log(error);
  }
}

export const bookmarkPost = async (req,res) => {
  try {
      const postId = req.params.id;
      const authorId = req.id;
      const post = await Post.findById(postId);
      if(!post) return res.status(404).json({message:'Post not found', success:false});
      
      const user = await User.findById(authorId);
      if(user.bookmarks.includes(post._id)){
          // already bookmarked -> remove from the bookmark
          await user.updateOne({$pull:{bookmarks:post._id}});
          await user.save();
          return res.status(200).json({type:'unsaved', message:'Post removed from bookmark', success:true});

      }else{
          // bookmark krna pdega
          await user.updateOne({$addToSet:{bookmarks:post._id}});
          await user.save();
          return res.status(200).json({type:'saved', message:'Post bookmarked', success:true});
      }

  } catch (error) {
      console.log(error);
  }
}