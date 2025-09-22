import User from '../Models/user.js';

// @desc    Create a new user
// @route   POST /api/users
// @access  Public
export const createUser = async (req, res) => {
    try {
        const newUser = await User.create(req.body);
        res.status(201).json({ success: true, data: newUser });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('posts')
            .select('-__v -password'); // Prevents returning sensitive data and version key
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a user by ID
// @route   PUT /api/users/:id
// @access  Public
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a user by ID
// @route   DELETE /api/users/:id
// @access  Public
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upvote or downvote a user
// @route   POST /api/users/:id/vote
// @access  Public
export const voteUser = async (req, res) => {
    const { voteType, voterId } = req.body; // voterId is the ID of the person voting
    const userId = req.params.id; // userId is the ID of the user being voted on

    if (!voteType || (voteType !== 'upvote' && voteType !== 'downvote')) {
        return res.status(400).json({ success: false, message: 'Invalid vote type. Use "upvote" or "downvote".' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check if the user has already voted
        if (user.votes.voters.includes(voterId)) {
            return res.status(409).json({ success: false, message: 'User has already voted.' });
        }

        const update = {};
        if (voteType === 'upvote') {
            update['votes.upvotes'] = 1;
        } else {
            update['votes.downvotes'] = 1;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $inc: update,
                $push: { 'votes.voters': voterId }
            },
            { new: true }
        );

        res.status(200).json({ success: true, data: updatedUser });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};