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

// @desc    Fetch and update all user profiles from LeetCode and GitHub
// @route   POST /api/users/update-profiles
// @access  Public (or Protected, depending on your app)
export const getProfile = async (req, res) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    // GraphQL query to get user profile and contribution calendar
    const githubQuery = `
        query($login: String!) {
            user(login: $login) {
                avatarUrl
                login
                bio
                url
                email
                contributionsCollection {
                    contributionCalendar {
                        weeks {
                            contributionDays {
                                contributionCount
                                date
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const users = await User.find().select('github leetcode');

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found to update.' });
        }

        for (const user of users) {
            const updateData = {};

            if (user.leetcode) {
                try {
                    const leetcodeResponse = await fetch(`https://alfa-leetcode-api.onrender.com/${user.leetcode}/calendar`);
                    if (leetcodeResponse.ok) {
                        const leetcodeData = await leetcodeResponse.json();
                        const dailyActivity = Object.values(leetcodeData);
                        updateData.activity = { last_30_days_activity: dailyActivity };
                    } else {
                        console.error(`Error fetching LeetCode data for ${user.leetcode}: ${leetcodeResponse.statusText}`);
                    }
                } catch (error) {
                    console.error(`LeetCode API request failed for ${user.leetcode}: ${error.message}`);
                }
            }

            if (user.github && GITHUB_TOKEN) {
                try {
                    const githubResponse = await fetch('https://api.github.com/graphql', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        },
                        body: JSON.stringify({
                            query: githubQuery,
                            variables: { login: user.github },
                        }),
                    });

                    if (githubResponse.ok) {
                        const result = await githubResponse.json();
                        const githubUser = result.data.user;

                        if (githubUser) {
                            const { bio, avatarUrl, url } = githubUser;
                            updateData.profileurl = url;
                            updateData.github = user.github;
                            updateData.readme = bio;

                            const allDays = githubUser.contributionsCollection.contributionCalendar.weeks.flatMap(week => week.contributionDays);
                            const last30Days = allDays.slice(-30).map(day => day.contributionCount);
                            updateData.activity = { last_30_days_activity: last30Days };
                        }
                    } else {
                        console.error(`Error fetching GitHub data for ${user.github}: ${githubResponse.statusText}`);
                    }
                } catch (error) {
                    console.error(`GitHub GraphQL API request failed for ${user.github}: ${error.message}`);
                }
            }

            if (Object.keys(updateData).length > 0) {
                await User.findByIdAndUpdate(user._id, updateData, { new: true, runValidators: true });
            }
        }

        res.status(200).json({ success: true, message: 'User profiles updated successfully.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

// @desc    Fetch and update a single user's profile from LeetCode and GitHub
// @route   POST /api/users/:id/profile
// @access  Public
export const getSingleProfile = async (req, res) => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const userId = req.params.id;

    const githubQuery = `
        query($login: String!) {
            user(login: $login) {
                avatarUrl
                login
                bio
                url
                email
                contributionsCollection {
                    contributionCalendar {
                        weeks {
                            contributionDays {
                                contributionCount
                                date
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const user = await User.findById(userId).select('github leetcode');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const updateData = {};

        // --- Fetch LeetCode Data ---
        if (user.leetcode) {
            try {
                const leetcodeResponse = await fetch(`https://alfa-leetcode-api.onrender.com/${user.leetcode}/calendar`);
                if (leetcodeResponse.ok) {
                    const leetcodeData = await leetcodeResponse.json();
                    const dailyActivity = Object.values(leetcodeData);
                    updateData.activity = { last_30_days_activity: dailyActivity };
                } else {
                    console.error(`Error fetching LeetCode data for ${user.leetcode}: ${leetcodeResponse.statusText}`);
                }
            } catch (error) {
                console.error(`LeetCode API request failed for ${user.leetcode}: ${error.message}`);
            }
        }

        // --- Fetch GitHub Data ---
        if (user.github && GITHUB_TOKEN) {
            try {
                const githubResponse = await fetch('https://api.github.com/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    },
                    body: JSON.stringify({
                        query: githubQuery,
                        variables: { login: user.github },
                    }),
                });

                if (githubResponse.ok) {
                    const result = await githubResponse.json();
                    const githubUser = result.data.user;

                    if (githubUser) {
                        const { bio, avatarUrl, url } = githubUser;
                        updateData.profileurl = url;
                        updateData.github = user.github;
                        updateData.readme = bio;

                        const allDays = githubUser.contributionsCollection.contributionCalendar.weeks.flatMap(week => week.contributionDays);
                        const last30Days = allDays.slice(-30).map(day => day.contributionCount);
                        updateData.activity = { last_30_days_activity: last30Days };
                    }
                } else {
                    console.error(`Error fetching GitHub data for ${user.github}: ${githubResponse.statusText}`);
                }
            } catch (error) {
                console.error(`GitHub GraphQL API request failed for ${user.github}: ${error.message}`);
            }
        }

        // --- Update User in Database ---
        if (Object.keys(updateData).length > 0) {
            const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
            return res.status(200).json({ success: true, data: updatedUser });
        } else {
            return res.status(404).json({ success: false, message: 'No data to update.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};
