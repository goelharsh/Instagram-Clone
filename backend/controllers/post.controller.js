import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comments.model.js";
export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.boyd;
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
    const fileUri = `data:image/jpeg:base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;
    console.log(fileUri);

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
    return req.status(200).json({
      message: "New post added",
      success: true,
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
    const { postId } = req.params.id;

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
    return res
    .status(200)
    .json({ message: "Posts disliked successfully", success: true, posts });

  } catch (error) {
    console.log(error);
  }
};

export const disLikePost = async (req, res) => {
  try {
    const { likeKrneWaleUserKiId } = req.id;
    const { postId } = req.params.id;

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
    return res
    .status(200)
    .json({ message: "Posts disliked successfully", success: true, posts });

  } catch (error) {
    console.log(error);
  }
};

export const addComment = async(req,res)=>{
  try {
    const userId = req.id;
    const postId = req.params.id;
    const {text} = req.body;
    if(!text){
      return res.status(400).json({
        message:"Text is required",
        success: false
      })
    }
    const post = await Post.findById(postId);
    const comment = await Comment.create({
      text,
      author: userId,
      post: postId
    }).populate({
      path: 'author',
      select: 'username, profilePicture'
    })

    post.comments.push(comment._id);
    await post.save();
    return res.status(200).json({
      message:"Comment added ",
      success:false,
      comment
    })
  } catch (error) {
    console.log(error)
  }
}

export const getCommentsRelatedToPost = async(req,res)=>{
  try {
    const {postId} = req.params.id;
    const comments = await Comment.find({post: postId}).populate('author', 'username profilePicture');
    if(!comments){
      return res.status(404).json({
        success:false,
        message:"No comments found for this post"
      })
    }

    return res.status(200).json({
      message:"Comments fetched",
      success:true,
      comments
    })
  } catch (error) {
    console.log(error);
  }
}

export const deletePost = async (req,res)=>{
  try {
    const {postId} = req.params.id;
    const {userId} = req.id;
    const post = await Post.findById(postId);
    if(!post){
      return res.status(404).json({
        success:false,
        message:"Post not found"
      })
    }
    // check if logged in user is owner of the account 
    if(post.author.toString() !== userId){
      return res.status(403).json({
        message:"Unauthorized",
        success:true,
      })
    }
    const deletedPost = await Post.findByIdAndDelete(postId);
    
    // deletePostFromUserSchema = 
    let user  = await User.findById(userId);
    user.posts = user.posts.filter(id => id.toString() !== postId)
    await user.save();

    // delete  comments associated with that post 
    await Comment.deleteMany({post: postId});

    return res.status(200).json({
      message:"Post deleted successfully",
      success:true,
      deletedPost
    })
  } catch (error) {
    console.log(error);
  }
}

export const bookmarkPost = async (req,res)=>{
  try {
    const postId = req.params.id;
    const userId = req.id;

    const post = await Post.findById(postId);
    const user = await User.findById(userId);
    if(!post || !user){
      return res.status(404).json({
        success:false,
        message:"User or post not found"
      })
    }

    if(user.bookmarks.includes(post._id)){
      // already bookrmaked then unbookmarked the post  
      await user.updateOne({pull: {bookmarks: post._id}});
      await user.save();
      return res.status(200).json({
        type: 'unsaved',
        success:true,
        message:"Post removed from bookmark"
      })
    }else{
      await user.updateOne({$addToSet: {bookmarks: post._id}});
      await user.save();
      return res.status(200).json({
        type: 'unsaved',
        success:true,
        message:"Post bookmarked"
      })
    }
  } catch (error) {
    console.log(error);
  }
}