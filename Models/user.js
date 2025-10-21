import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    github: String,
    leetcode: String,
    linkedin: String,
    readme: String,
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
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
    },
    profileurl: {
        type: String,
        trim: true
    },
    // This is the updated part.
    // It's an array of 30 numbers, where each number represents
    // the activity count for a specific day.
    activity: {
        last_30_days_activity: [{
            type: Number,
            min: 0
        }]
    }
});

export default mongoose.model('User', UserSchema);