const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
	{
		// firstName: {
		// 	required: [true, 'First name is required'],
		// 	type: String,
		// },
		// lastName: {
		// 	required: [true, 'Last name is required'],
		// 	type: String,
		// },
		handle: {
			required: [true, 'Handle is required'],
			type: String,
			unique: true,
		},
		profilePhoto: {
			type: String,
			default:
				'https://res.cloudinary.com/hllcxfhvx/image/upload/v1640128010/woft1anujwd052kwocaj.jpg',
		},
		email: {
			required: [true, 'Email is required'],
			type: String,
			unique: true,
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
		},
		bio: {
			type: String,
		},
		postCount: {
			type: Number,
			default: 0,
		},
		isBlocked: {
			type: Boolean,
			default: false,
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		isSuperUser: {
			type: Boolean,
			default: false,
		},
		role: {
			type: String,
			enum: ['Admin', 'Guest', 'Blogger'],
		},
		isFollowing: {
			type: Boolean,
			default: false,
		},
		isUnfollowing: {
			type: Boolean,
			default: false,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		accountVerificationToken: {
			type: String,
		},
		accountVerificationTokenExpires: {
			type: Date,
		},
		viewedBy: {
			type: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User',
				},
			],
		},
		followers: {
			type: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User',
				},
			],
		},
		following: {
			type: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User',
				},
			],
		},
		passwordChangeAt: {
			type: Date,
		},
		passwordResetToken: {
			type: String,
		},
		passwordResetTokenExpires: {
			type: Date,
		},
		active: {
			type: Boolean,
			default: false,
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

// Populate created posts
userSchema.virtual('posts', {
	ref: 'Post',
	foreignField: 'user',
	localField: '_id',
});

userSchema.pre('save', function (next) {
	const user = this;
	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.genSalt(10, (err, salt) => {
		if (err) {
			return next(err);
		}

		bcrypt.hash(user.password, salt, (err, hash) => {
			if (err) {
				return next(err);
			}
			user.password = hash;
			next();
		});
	});
});

userSchema.methods.comparePassword = function (candidatePassword) {
	const user = this;

	return new Promise((resolve, reject) => {
		bcrypt.compare(candidatePassword, user.password, (err, isMatch) => {
			if (err) {
				return reject(err);
			}

			if (!isMatch) {
				return reject(false);
			}

			resolve(true);
		});
	});
};

userSchema.methods.createVerificationToken = function () {
	const verificationToken = crypto.randomBytes(32).toString('hex');
	this.accountVerificationToken = crypto
		.createHash('sha256')
		.update(verificationToken)
		.digest('hex');
	this.accountVerificationTokenExpires = Date.now() + 30 * 60 * 1000;
	return verificationToken;
};

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');
	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');
	this.passwordResetTokenExpires = Date.now() + 30 * 60 * 1000;
	return resetToken;
};

mongoose.model('User', userSchema);
