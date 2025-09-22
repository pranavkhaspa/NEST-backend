import mongoose from 'mongoose';
import 'dotenv/config.js';

// Import your Mongoose models
import User from './Models/user.js';
import Post from './Models/post.js';
import Opportunity from './Models/oppurtunity.js';

const usersData = [
    { name: 'Sagar', github: 'sagargit', leetcode: 'sagarleet', readme: 'A full-stack enthusiast.' },
    { name: 'Priya', github: 'priyagithub', leetcode: 'priyaleet', readme: 'Interested in AI and ML.' },
    { name: 'Rahul', github: 'rahuldev', leetcode: 'rahulcodes', readme: 'Learning cybersecurity.' }
];

const postsData = [
    { content: 'Just started a new project on a blockchain-based voting system!', tags: ['blockchain', 'voting'], postedBy: null },
    { content: 'Looking for teammates for a hackathon on frontend technologies.', tags: ['hackathon', 'frontend'], postedBy: null },
    { content: 'What are the best resources to learn about cloud computing?', tags: ['cloud'], postedBy: null }
];

const opportunitiesData = [
    {
        title: 'Blockchain Workshop',
        date: new Date('2025-10-20'),
        place: 'MVGR Campus, CSE Block',
        priceMoney: 0,
        organization: 'MVGR College of Engineering'
    },
    {
        title: 'Smart India Hackathon',
        date: new Date('2025-11-15'),
        place: 'Online',
        priceMoney: 50000,
        organization: 'Government of India'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding!');

        // Clear existing data to avoid duplicates
        await User.deleteMany({});
        await Post.deleteMany({});
        await Opportunity.deleteMany({});
        console.log('Old data cleared.');

        // Insert new users
        const createdUsers = await User.insertMany(usersData);
        console.log('Users seeded successfully!');

        // Assign posts to users and insert them
        // This is crucial to establish the relationship
        const post1 = new Post({ ...postsData[0], postedBy: createdUsers[0]._id });
        const post2 = new Post({ ...postsData[1], postedBy: createdUsers[1]._id });
        const post3 = new Post({ ...postsData[2], postedBy: createdUsers[0]._id });

        const createdPosts = await Post.insertMany([post1, post2, post3]);
        console.log('Posts seeded successfully!');

        // Link posts back to the users' profiles
        await User.findByIdAndUpdate(createdUsers[0]._id, { $push: { posts: [post1._id, post3._id] } });
        await User.findByIdAndUpdate(createdUsers[1]._id, { $push: { posts: post2._id } });

        // Insert opportunities
        await Opportunity.insertMany(opportunitiesData);
        console.log('Opportunities seeded successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.disconnect();
        console.log('Database connection closed.');
    }
};

seedDB();