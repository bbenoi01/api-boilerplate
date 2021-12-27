const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports = (req, res, next) => {
	const { authorization } = req.headers;

	if (!authorization) {
		return res.status(401).json('You must be logged in.');
	}

	try {
		const token = authorization.replace('Bearer ', '');
		if (token) {
			jwt.verify(token, 'MY_SECRET_KEY', async (err, payload) => {
				const { userId } = payload;
				const user = await User.findById(userId).select('-password');
				req.user = user;
				next();
			});
		} else {
			return res.status(401).json('You must be logged in.');
		}
	} catch (err) {
		return res.status(401).json('You must be logged in.');
	}
};
