import User from "../Models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, username, password, github, leetcode, linkedin } =
    req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Create a new user instance
    user = new User({
      name,
      email,
      username,
      password,
      github,
      leetcode,
      linkedin,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();

    // Fetch user without password for response
    const userWithoutPassword = await User.findById(user._id).select(
      "-password"
    );

    // Create and return a JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5d" },
      (err, token) => {
        if (err) {
          console.error("JWT sign error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Token generation failed" });
        }
        res
          .status(201)
          .json({ success: true, token, user: userWithoutPassword });
      }
    );
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Fetch user without password for response
    const userWithoutPassword = await User.findById(user._id).select(
      "-password"
    );

    // Create and return a JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5d" },
      (err, token) => {
        if (err) {
          console.error("JWT sign error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Token generation failed" });
        }
        res.json({ success: true, token, user: userWithoutPassword });
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

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
      .populate("posts")
      .select("-__v -password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
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
    const { name, bio, github, leetcode, linkedin, skills } = req.body;
    const updateFields = { name, bio, github, leetcode, linkedin, skills };

    // Remove undefined fields to prevent overwriting with null/undefined
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote or downvote a user
// @route   POST /api/users/:id/vote
// @access  Public
export const voteUser = async (req, res) => {
  const { voteType, voterId } = req.body;
  const userId = req.params.id;

  if (!voteType || (voteType !== "upvote" && voteType !== "downvote")) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vote type. Use "upvote" or "downvote".',
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.votes.voters.includes(voterId)) {
      return res
        .status(409)
        .json({ success: false, message: "User has already voted." });
    }

    const update = {};
    if (voteType === "upvote") {
      update["votes.upvotes"] = 1;
    } else {
      update["votes.downvotes"] = 1;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: update,
        $push: { "votes.voters": voterId },
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// @desc    Fetch and update all user profiles from LeetCode and GitHub
// @route   POST /api/users/update-profiles
// @access  Public (or Protected)
export const getProfile = async (req, res) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
    const users = await User.find().select("github leetcode");

    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found to update." });
    }

    for (const user of users) {
      const updateData = {};

      if (user.leetcode) {
        try {
          // ⚠️ Fixed extra spaces in URL
          const leetcodeResponse = await fetch(
            `https://alfa-leetcode-api.onrender.com/${user.leetcode}/calendar`
          );
          if (leetcodeResponse.ok) {
            const leetcodeData = await leetcodeResponse.json();
            const dailyActivity = Object.values(leetcodeData);
            updateData.activity = { last_30_days_activity: dailyActivity };
          } else {
            console.error(
              `Error fetching LeetCode data for ${user.leetcode}: ${leetcodeResponse.statusText}`
            );
          }
        } catch (error) {
          console.error(
            `LeetCode API request failed for ${user.leetcode}: ${error.message}`
          );
        }
      }

      if (user.github && GITHUB_TOKEN) {
        try {
          // ⚠️ Fixed extra spaces in URL
          const githubResponse = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GITHUB_TOKEN}`,
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

              //
              // ✨ --- THIS WAS THE SYNTAX ERROR --- ✨
              // The broken line 'profilePicture = avatarUrl;updateData.' is fixed
              updateData.profilePicture = avatarUrl;
              //
              //

              const allDays =
                githubUser.contributionsCollection.contributionCalendar.weeks.flatMap(
                  (week) => week.contributionDays
                );
              const last30Days = allDays
                .slice(-30)
                .map((day) => day.contributionCount);
              updateData.activity = { last_30_days_activity: last30Days };
            }
          } else {
            console.error(
              `Error fetching GitHub data for ${user.github}: ${githubResponse.statusText}`
            );
          }
        } catch (error) {
          console.error(
            `GitHub GraphQL API request failed for ${user.github}: ${error.message}`
          );
        }
      }

      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(user._id, updateData, {
          new: true,
          runValidators: true,
        });
      }
    }

    res
      .status(200)
      .json({ success: true, message: "User profiles updated successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
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
    const user = await User.findById(userId).select("github leetcode");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const updateData = {};

    if (user.leetcode) {
      try {
        // ⚠️ Fixed extra spaces in URL
        const leetcodeResponse = await fetch(
          `https://alfa-leetcode-api.onrender.com/${user.leetcode}/calendar`
        );
        if (leetcodeResponse.ok) {
          const leetcodeData = await leetcodeResponse.json();
          const dailyActivity = Object.values(leetcodeData);
          updateData.activity = { last_30_days_activity: dailyActivity };
        } else {
          console.error(
            `Error fetching LeetCode data for ${user.leetcode}: ${leetcodeResponse.statusText}`
          );
        }
      } catch (error) {
        console.error(
          `LeetCode API request failed for ${user.leetcode}: ${error.message}`
        );
      }
    }

    if (user.github && GITHUB_TOKEN) {
      try {
        // ⚠️ Fixed extra spaces in URL
        const githubResponse = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GITHUB_TOKEN}`,
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

            //
            // ✨ --- THIS WAS THE LOGIC BUG --- ✨
            // Added this line to actually save the avatarUrl
            updateData.profilePicture = avatarUrl;
            //
            //

            const allDays =
              githubUser.contributionsCollection.contributionCalendar.weeks.flatMap(
                (week) => week.contributionDays
              );
            const last30Days = allDays
              .slice(-30)
              .map((day) => day.contributionCount);
            updateData.activity = { last_30_days_activity: last30Days };
          }
        } else {
          console.error(
            `Error fetching GitHub data for ${user.github}: ${githubResponse.statusText}`
          );
        }
      } catch (error) {
        console.error(
          `GitHub GraphQL API request failed for ${user.github}: ${error.message}`
        );
      }
    }

    if (Object.keys(updateData).length > 0) {
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });
      return res.status(200).json({ success: true, data: updatedUser });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "No data to update." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};
