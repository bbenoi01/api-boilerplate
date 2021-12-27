const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const Generic = mongoose.model('Generic');
const User = mongoose.model('User');
const requireAuth = require('../middleware/requireAuth');
const multer = require('multer');
const Filter = require('bad-words');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// router.put('/updateallgenerics', async (req, res) => {
// 	const updatedGenerics = await Generic.updateMany({
// 		numViews: 0,
// 	});
// 	res.json(updatedGenerics);
// });

// Create Generic
const storage = multer.memoryStorage();

const filter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb({ message: 'Unsupported file format.' }, false);
	}
};

const upload = multer({
	storage: storage,
	fileFilter: filter,
	limits: { fileSize: 5000000 },
});

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_SECRET_KEY,
	secure: true,
});

const cloudinaryUpload = async (fileToUpload) => {
	try {
		const data = await cloudinary.uploader.upload(fileToUpload, {
			resource_type: 'auto',
		});
		return {
			url: data?.secure_url,
		};
	} catch (err) {
		return err;
	}
};

router.post(
	'/api/generics',
	requireAuth,
	upload.single('file'),
	async (req, res) => {
		const { _id, handle } = req?.user;
		const { title, description, b64str } = req?.body;
		let errors = {};
		const pendingGeneric = title + ' ' + description;
		const filter = new Filter();
		const isProfane = filter.isProfane(pendingGeneric);
		if (isProfane) {
			await User.findByIdAndUpdate(_id, {
				isBlocked: true,
			});
			errors.generics =
				'Generic creation failed due to the use of profanity and you have been blocked.';
			return res.status(403).json(errors);
		} else {
			if (req?.file) {
				const uploadedImage = await cloudinaryUpload(b64str);
				try {
					const generic = await Generic.create({
						...req?.body,
						handle,
						media: uploadedImage?.url,
						user: _id,
					});
					res.json(generic);
				} catch (err) {
					errors.generics = 'Error creating generic';
					return res.status(400).json(errors);
				}
			} else {
				try {
					const generic = await Generic.create({
						...req?.body,
						handle,
						user: _id,
					});
					res.json(generic);
				} catch (err) {
					errors.generics = 'Error creating generic';
					return res.status(400).json(errors);
				}
			}
		}
	}
);

// Like Generic
router.put('/api/generics/like', requireAuth, async (req, res) => {
	const { genericId } = req?.body;
	let errors = {};

	try {
		const generic = await Generic.findById(genericId);
		const loginUserId = req?.user?._id;
		const likedByCurrentUser = generic?.likes?.find(
			(userId) => userId?.toString() === loginUserId?.toString()
		);
		const alreadyDisliked = generic?.dislikes?.find(
			(userId) => userId?.toString() === loginUserId?.toString()
		);

		if (alreadyDisliked) {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$pull: { dislikes: loginUserId },
				},
				{ new: true }
			);
		}

		if (likedByCurrentUser) {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$pull: { likes: loginUserId },
				},
				{ new: true }
			);
		} else {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$push: { likes: loginUserId },
				},
				{ new: true }
			);
		}
		const likedGeneric = await Generic.findById(genericId);
		const updatedGenerics = await Generic.find({}).sort('-createdAt');
		res.json({ generic: likedGeneric, generics: updatedGenerics });
	} catch (err) {
		errors.like = 'Error liking generic';
		return res.status(400).json(errors);
	}
});

// Annon Like Generic
router.put('/api/generics/like/annon', async (req, res) => {
	const { genericId, annonId } = req?.body;
	let errors = {};

	try {
		const generic = await Generic.findById(genericId);
		const likedByCurrentUser = generic?.likes?.find(
			(userId) => userId?.toString() === annonId?.toString()
		);
		const alreadyDisliked = generic?.dislikes?.find(
			(userId) => userId?.toString() === annonId?.toString()
		);

		if (alreadyDisliked) {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$pull: { dislikes: annonId },
				},
				{ new: true }
			);
		}

		if (likedByCurrentUser) {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$pull: { likes: annonId },
				},
				{ new: true }
			);
		} else {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$push: { likes: annonId },
				},
				{ new: true }
			);
		}
		const likedGeneric = await Generic.findById(genericId);
		const updatedGenerics = await Generic.find({}).sort('-createdAt');
		res.json({ generic: likedGeneric, generics: updatedGenerics });
	} catch (err) {
		errors.like = 'Error liking generic';
		return res.status(400).json(errors);
	}
});

// Dislike Generic
router.put('/api/generics/dislike', requireAuth, async (req, res) => {
	const { genericId } = req?.body;
	let errors = {};

	try {
		const generic = await Generic.findById(genericId);
		const loginUserId = req?.user?._id;
		const dislikedByCurrentUser = generic?.dislikes?.find(
			(userId) => userId?.toString() === loginUserId?.toString()
		);
		const alreadyLiked = generic?.likes?.find(
			(userId) => userId?.toString() === loginUserId?.toString()
		);

		if (alreadyLiked) {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$pull: { likes: loginUserId },
				},
				{ new: true }
			);
		}

		if (dislikedByCurrentUser) {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$pull: { dislikes: loginUserId },
				},
				{ new: true }
			);
		} else {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$push: { dislikes: loginUserId },
				},
				{ new: true }
			);
		}
		const dislikedGeneric = await Generic.findById(genericId);
		const updatedGenerics = await Generic.find({}).sort('-createdAt');
		res.json({ generic: dislikedGeneric, generics: updatedGenerics });
	} catch (err) {
		errors.dislike = 'Error disliking generic';
		return res.status(400).json(errors);
	}
});

// Annon Dislike Generic
router.put('/api/generics/dislike/annon', async (req, res) => {
	const { genericId, annonId } = req?.body;
	let errors = {};

	try {
		const generic = await Generic.findById(genericId);
		const dislikedByCurrentUser = generic?.dislikes?.find(
			(userId) => userId?.toString() === annonId?.toString()
		);
		const alreadyLiked = generic?.likes?.find(
			(userId) => userId?.toString() === annonId?.toString()
		);
		if (alreadyLiked) {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$pull: { likes: annonId },
				},
				{ new: true }
			);
		}

		if (dislikedByCurrentUser) {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$pull: { dislikes: annonId },
				},
				{ new: true }
			);
		} else {
			await Generic.findByIdAndUpdate(
				genericId,
				{
					$push: { dislikes: annonId },
				},
				{ new: true }
			);
		}
		const dislikedGeneric = await Generic.findById(genericId);
		const updatedGenerics = await Generic.find({}).sort('-createdAt');
		res.json({ generic: dislikedGeneric, generics: updatedGenerics });
	} catch (err) {
		errors.dislike = 'Error disliking generic';
		return res.status(400).json(errors);
	}
});

// Get All Generics
router.get('/api/generics', async (req, res) => {
	const hasCategory = req?.query?.category;
	const hasHandle = req?.query?.handle;
	let errors = {};
	let generics;
	try {
		if (hasCategory) {
			generics = await Generic.find({ category: hasCategory })
				.populate('user')
				.sort('-createdAt');
		} else if (hasHandle) {
			generics = await Generic.find({ handle: hasHandle })
				.populate('user')
				.sort('-createdAt');
		} else {
			generics = await Generic.find({}).populate('user').sort('-createdAt');
		}
		res.json(generics);
	} catch (err) {
		errors.generics = 'Error getting generics';
		return res.status(400).json(errors);
	}
});

// Get Single Generic
router.get('/api/generics/:id', async (req, res) => {
	const { id } = req?.params;
	let errors = {};
	const generic = await Generic.findById(id).populate('user');
	if (!generic) {
		errors.generics = 'Error, generic not found';
		return res.status(404).json(errors);
	}
	try {
		// Update number of views
		await Generic.findByIdAndUpdate(
			id,
			{
				$inc: { numViews: 1 },
			},
			{ new: true }
		);
		const generic = await Generic.findById(id).populate('user');
		res.json(generic);
	} catch (err) {
		errors.generics = 'Error getting generic';
		return res.status(400).json(errors);
	}
});

// Update Generic
router.put('/api/generics/:id', requireAuth, async (req, res) => {
	const { id } = req?.params;
	let errors = {};
	const generic = await Generic.findById(id);
	if (!generic) {
		errors.generic = 'Error, generic not found';
		return res.status(404).json(errors);
	}

	const { title, description } = req?.body;
	const pendingGeneric = title + ' ' + description;
	const filter = new Filter();
	const isProfane = filter.isProfane(pendingGeneric);
	if (isProfane) {
		errors.generics = 'Generic update failed due to use of profanity';
		return res.status(403).json(errors);
	} else {
		try {
			const updatedGeneric = await Generic.findByIdAndUpdate(
				id,
				{
					$set: req?.body,
					user: req?.user?._id,
				},
				{
					new: true,
				}
			);
			res.json(updatedGeneric);
		} catch (err) {
			errors.update = 'Error updating generic';
			return res.status(400).json(errors);
		}
	}
});

// Delete Generic
router.delete('/api/generics/:id', requireAuth, async (req, res) => {
	const { id } = req?.params;
	let errors = {};
	const generic = await Generic.findById(id);
	if (!generic) {
		errors.generics = 'Error, generic not found';
		return res.status(404).json(errors);
	}
	try {
		const deletedGeneric = await generic?.delete();
		res.json(deletedGeneric);
	} catch (err) {
		errors.delete = 'Error deleting generic';
		return res.status(400).json(errors);
	}
});

module.exports = router;
