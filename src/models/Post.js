const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Post title is required'],
			trim: true,
			unique: true,
		},
		category: {
			type: String,
			required: [true, 'Post category is required'],
		},
		isLiked: {
			type: Boolean,
			default: false,
		},
		isDisliked: {
			type: Boolean,
			default: false,
		},
		numViews: {
			type: Number,
			default: 0,
		},
		likes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		dislikes: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		handle: {
			type: String,
			required: [true, 'Handle is required'],
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Author is required'],
		},
		description: {
			type: String,
			required: [true, 'Description is required'],
		},
		media: {
			type: String,
			default:
				'https://res.cloudinary.com/dcxmdnu2h/image/upload/v1638247712/epnc8zh9wab8x31vbqjq.jpg',
		},
		blogType: {
			type: String,
			required: true,
			default: 'blog',
		},
	},
	{
		toJSON: {
			virtuals: true,
		},
		toObject: {
			virtuals: true,
		},
		timestamps: true,
	}
);

postSchema.virtual('comments', {
	ref: 'Comment',
	foreignField: 'post',
	localField: '_id',
});

mongoose.model('Post', postSchema);
