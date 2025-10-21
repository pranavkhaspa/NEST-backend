import express from 'express';
import {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    voteUser,
    getProfile,
    getSingleProfile
} from '../Controllers/UserController.js';

const router = express.Router();

// @route   POST api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', registerUser);

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// READ all users
router.get('/', getAllUsers);

// READ a single user by ID
router.get('/:id', getUserById);

// UPDATE a user by ID
router.put('/:id', updateUser);

// DELETE a user by ID
router.delete('/:id', deleteUser);

// Route for upvoting and downvoting a user
router.post('/:id/vote', voteUser);

// Route to fetch and update ALL user profiles
router.get("/profiles", getProfile);

// Route to fetch and update a SINGLE user's profile
router.get("/:id/profile", getSingleProfile);

export default router;
