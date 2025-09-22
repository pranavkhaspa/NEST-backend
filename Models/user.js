import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Add other basic user details
    github: String,
    leetcode: String,
    linkedin: String,
    readme: String,

    // This is the key part for connecting posts to a user.
    // It's an array of ObjectIds that reference the 'Post' model.
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],

    // We'll track upvotes and downvotes to calculate a user's score
    // The 'voters' array stores the IDs of users who have voted, to prevent multiple votes from one person.
    votes: {
        upvotes: {
            type: Number,
            default: 0
        },
        downvotes: {
            type: Number,
            default: 0
        },
        voters: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    }
});

export default mongoose.model('User', UserSchema);