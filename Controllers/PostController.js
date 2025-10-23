import Post from "../Models/post.js";
import User from "../Models/user.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config.js";

// Initialize Gemini AI with error handling
let genAI = null;
let geminiEnabled = false;

if (
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== "your_actual_valid_api_key_here"
) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiEnabled = true;
    console.log("✅ Gemini AI enabled successfully");
  } catch (error) {
    console.warn("❌ Gemini AI initialization failed:", error.message);
    geminiEnabled = false;
  }
} else {
  console.warn("⚠️ GEMINI_API_KEY not configured, AI features disabled");
}

// Helper function to call Gemini AI with robust error handling
const analyzeContentWithAI = async (content) => {
  if (!geminiEnabled || !genAI) {
    console.log("🤖 Gemini AI not available, using fallback");
    return { tags: [], summary: "" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Analyze the following text from a student discussion post. 
Provide a very brief summary (max 2 sentences) and a list of 3-5 relevant technical tags.
Respond with a JSON object only with this exact format:
{
  "summary": "brief summary here",
  "tags": ["tag1", "tag2", "tag3"]
}

Text: ${content.substring(0, 2000)}  // Limit content length for API
    `;

    console.log("🤖 Sending request to Gemini AI...");
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Clean the response - remove markdown code blocks if present
    let jsonString = rawText;
    if (rawText.includes("```json")) {
      jsonString = rawText.split("```json")[1].split("```")[0];
    } else if (rawText.includes("```")) {
      jsonString = rawText.split("```")[1].split("```")[0];
    }

    // Remove any extra whitespace and parse
    jsonString = jsonString.trim();
    const geminiData = JSON.parse(jsonString);

    // Validate the response structure
    if (!geminiData.summary || !Array.isArray(geminiData.tags)) {
      throw new Error("Invalid response format from Gemini AI");
    }

    console.log("✅ Gemini AI analysis successful");
    return geminiData;
  } catch (error) {
    console.error("❌ Gemini AI analysis failed:", error.message);
    // Return fallback data instead of throwing
    return { tags: [], summary: "" };
  }
};

// @desc    Create a new post with AI-powered summary and tags
// @route   POST /api/posts
// @access  Public
export const createPost = async (req, res) => {
  const { content, userId } = req.body;

  if (!content || !userId) {
    return res.status(400).json({
      success: false,
      message: "Content and userId are required",
    });
  }

  try {
    let geminiData = { tags: [], summary: "" };
    let aiStatus = "disabled";

    // Only use AI if enabled and content is substantial
    if (geminiEnabled && content.length > 10) {
      try {
        console.log("🤖 Starting AI analysis for post content...");
        geminiData = await analyzeContentWithAI(content);
        aiStatus = "success";
        console.log("✅ AI analysis completed successfully");
      } catch (aiError) {
        console.warn(
          "⚠️ AI analysis failed, creating post without AI features"
        );
        aiStatus = "failed";
        // Continue with empty AI data - don't fail the entire request
      }
    } else {
      console.log("ℹ️ AI features disabled or content too short");
    }

    // Create the post
    const newPost = await Post.create({
      content,
      postedBy: userId,
      tags: geminiData.tags || [],
      summary: geminiData.summary || "",
      aiStatus: aiStatus, // Track AI processing status
    });

    // Link the new post's ID back to the user's posts array
    await User.findByIdAndUpdate(userId, { $push: { posts: newPost._id } });

    console.log("✅ Post created successfully with AI status:", aiStatus);
    res.status(201).json({
      success: true,
      data: newPost,
      aiStatus: aiStatus,
    });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
};

// @desc    Get all posts with pagination and sorting
// @route   GET /api/posts
// @access  Public
export const getAllPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const posts = await Post.find()
      .populate("postedBy", "name username email")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments();

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: posts,
    });
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single post by ID with full population
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("postedBy", "name username email")
      .populate({
        path: "comments",
        populate: {
          path: "commentedBy",
          select: "name username",
        },
      })
      .populate({
        path: "comments.replies",
        populate: {
          path: "commentedBy",
          select: "name username",
        },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("❌ Error fetching post:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a post by ID with optional AI re-analysis
// @route   PUT /api/posts/:id
// @access  Public
export const updatePost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required for update",
      });
    }

    let updateData = { content };

    // If content is updated and AI is enabled, re-run AI analysis
    if (content && geminiEnabled) {
      try {
        console.log("🤖 Re-analyzing updated content with AI...");
        const geminiData = await analyzeContentWithAI(content);
        updateData.tags = geminiData.tags;
        updateData.summary = geminiData.summary;
        updateData.aiStatus = "updated";
        console.log("✅ AI re-analysis completed");
      } catch (aiError) {
        console.warn("⚠️ AI re-analysis failed during update");
        updateData.aiStatus = "update_failed";
      }
    }

    const post = await Post.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("❌ Error updating post:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a post by ID
// @route   DELETE /api/posts/:id
// @access  Public
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Remove the post's ID from the user's posts array
    await User.findByIdAndUpdate(post.postedBy, {
      $pull: { posts: post._id },
    });

    console.log("✅ Post deleted successfully");
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting post:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote or downvote a post
// @route   POST /api/posts/:id/vote
// @access  Public
export const votePost = async (req, res) => {
  const { voteType, userId } = req.body;
  const postId = req.params.id;

  if (!voteType || (voteType !== "upvote" && voteType !== "downvote")) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vote type. Use "upvote" or "downvote".',
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required",
    });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Check if the user has already voted
    const hasVoted = post.votes.voters.includes(userId);

    if (hasVoted) {
      return res.status(409).json({
        success: false,
        message: "User has already voted on this post.",
      });
    }

    const update = {};
    if (voteType === "upvote") {
      update["votes.upvotes"] = 1;
    } else {
      update["votes.downvotes"] = 1;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $inc: update,
        $push: { "votes.voters": userId },
      },
      { new: true }
    );

    console.log(`✅ ${voteType} recorded for post ${postId}`);
    res.status(200).json({ success: true, data: updatedPost });
  } catch (error) {
    console.error("❌ Error voting on post:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// @desc    Upvote or downvote a comment
// @route   POST /api/posts/:postId/comment/:commentId/vote
// @access  Public
export const voteComment = async (req, res) => {
  const { voteType, userId } = req.body;
  const { postId, commentId } = req.params;

  if (!voteType || (voteType !== "upvote" && voteType !== "downvote")) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vote type. Use "upvote" or "downvote".',
    });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    // Initialize votes if not present
    if (!comment.votes) {
      comment.votes = { upvotes: [], downvotes: [] };
    }

    // Remove user from both arrays first
    comment.votes.upvotes = comment.votes.upvotes.filter(
      (id) => !id.equals(userId)
    );
    comment.votes.downvotes = comment.votes.downvotes.filter(
      (id) => !id.equals(userId)
    );

    // Add to appropriate array based on vote type
    if (voteType === "upvote") {
      comment.votes.upvotes.push(userId);
    } else if (voteType === "downvote") {
      comment.votes.downvotes.push(userId);
    }

    await post.save();
    console.log(`✅ ${voteType} recorded for comment ${commentId}`);
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("❌ Error voting on comment:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// @desc    Upvote or downvote a reply
// @route   POST /api/posts/:postId/comment/:commentId/reply/:replyId/vote
// @access  Public
export const voteReply = async (req, res) => {
  const { voteType, userId } = req.body;
  const { postId, commentId, replyId } = req.params;

  if (!voteType || (voteType !== "upvote" && voteType !== "downvote")) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vote type. Use "upvote" or "downvote".',
    });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found.",
      });
    }

    // Initialize votes if not present
    if (!reply.votes) {
      reply.votes = { upvotes: [], downvotes: [] };
    }

    // Remove user from both arrays first
    reply.votes.upvotes = reply.votes.upvotes.filter(
      (id) => !id.equals(userId)
    );
    reply.votes.downvotes = reply.votes.downvotes.filter(
      (id) => !id.equals(userId)
    );

    // Add to appropriate array based on vote type
    if (voteType === "upvote") {
      reply.votes.upvotes.push(userId);
    } else if (voteType === "downvote") {
      reply.votes.downvotes.push(userId);
    }

    await post.save();
    console.log(`✅ ${voteType} recorded for reply ${replyId}`);
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("❌ Error voting on reply:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Public
export const addComment = async (req, res) => {
  const { text, commentedBy } = req.body;
  const postId = req.params.id;

  if (!text || !commentedBy) {
    return res.status(400).json({
      success: false,
      message: "Text and commentedBy are required",
    });
  }

  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            text,
            commentedBy,
            votes: {
              upvotes: [],
              downvotes: [],
            },
          },
        },
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    console.log("✅ Comment added successfully");
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// @desc    Reply to a comment on a post
// @route   POST /api/posts/:postId/comment/:commentId/reply
// @access  Public
export const addCommentReply = async (req, res) => {
  const { text, commentedBy } = req.body;
  const { postId, commentId } = req.params;

  if (!text || !commentedBy) {
    return res.status(400).json({
      success: false,
      message: "Text and commentedBy are required",
    });
  }

  try {
    const post = await Post.findOneAndUpdate(
      { _id: postId, "comments._id": commentId },
      {
        $push: {
          "comments.$.replies": {
            text,
            commentedBy,
            votes: {
              upvotes: [],
              downvotes: [],
            },
          },
        },
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post or comment not found.",
      });
    }

    console.log("✅ Reply added successfully");
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error("❌ Error adding reply:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};
