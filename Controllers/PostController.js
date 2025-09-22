import Post from '../Models/post.js';
import User from '../Models/user.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Create a new post with AI-powered summary and tags
// @route   POST /api/posts
// @access  Public
export const createPost = async (req, res) => {
    const { content, userId } = req.body;

    try {
        // Step 1: Call the Gemini API for analysis
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Analyze the following text from a student discussion post. 
            Provide a very brief summary and a list of relevant technical tags (e.g., "blockchain", "AI", "web-dev", "frontend").
            Respond with a JSON object only. The JSON should have two keys: 'summary' (string) and 'tags' (array of strings).

            Text: ${content}
        `;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        // Handle potential markdown formatting from the API
        const jsonString = rawText.startsWith('```json') ? rawText.substring(7, rawText.lastIndexOf('```')) : rawText;

        const geminiData = JSON.parse(jsonString);

        // Step 2: Create the post using data from the request and Gemini API
        const newPost = await Post.create({
            content,
            postedBy: userId,
            tags: geminiData.tags || [],
            summary: geminiData.summary || ''
        });

        // Step 3: Link the new post's ID back to the user's posts array
        await User.findByIdAndUpdate(userId, { $push: { posts: newPost._id } });

        res.status(201).json({ success: true, data: newPost });
    } catch (error) {
        console.error('Error creating post or using Gemini API:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};


// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate('postedBy');
        res.status(200).json({ success: true, count: posts.length, data: posts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('postedBy')
            .populate({
                path: 'comments',
                populate: {
                    path: 'commentedBy',
                    select: 'name' // Only populate the user's name
                }
            });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.status(200).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Update a post by ID
// @route   PUT /api/posts/:id
// @access  Public
export const updatePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.status(200).json({ success: true, data: post });
    } catch (error) {
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
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Also remove the post's ID from the user's posts array
        await User.findByIdAndUpdate(post.postedBy, { $pull: { posts: post._id } });

        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Upvote or downvote a post
// @route   POST /api/posts/:id/vote
// @access  Public
export const votePost = async (req, res) => {
    const { voteType, userId } = req.body;
    const postId = req.params.id;

    if (!voteType || (voteType !== 'upvote' && voteType !== 'downvote')) {
        return res.status(400).json({ success: false, message: 'Invalid vote type. Use "upvote" or "downvote".' });
    }

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }

        // Check if the user has already voted
        const hasVoted = post.votes.voters.includes(userId);

        if (hasVoted) {
            return res.status(409).json({ success: false, message: 'User has already voted on this post.' });
        }

        const update = {};
        if (voteType === 'upvote') {
            update['votes.upvotes'] = 1;
        } else {
            update['votes.downvotes'] = 1;
        }

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $inc: update,
                $push: { 'votes.voters': userId }
            },
            { new: true }
        );

        res.status(200).json({ success: true, data: updatedPost });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};


// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Public
export const addComment = async (req, res) => {
    const { text, commentedBy } = req.body;
    const postId = req.params.id;

    try {
        const post = await Post.findByIdAndUpdate(
            postId,
            {
                $push: {
                    comments: {
                        text,
                        commentedBy
                    }
                }
            },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }
        res.status(201).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};


// @desc    Reply to a comment on a post
// @route   POST /api/posts/:postId/comment/:commentId/reply
// @access  Public
export const addCommentReply = async (req, res) => {
    const { text, commentedBy } = req.body;
    const { postId, commentId } = req.params;

    try {
        const post = await Post.findOneAndUpdate(
            { "_id": postId, "comments._id": commentId },
            {
                $push: {
                    "comments.$.replies": {
                        text,
                        commentedBy
                    }
                }
            },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post or comment not found.' });
        }
        res.status(201).json({ success: true, data: post });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};