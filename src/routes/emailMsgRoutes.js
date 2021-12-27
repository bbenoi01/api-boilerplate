const express = require('express');
const mongoose = require('mongoose');
const EmailMsg = mongoose.model('EmailMsg');
const Filter = require('bad-words');
const requireAuth = require('../middleware/requireAuth');
const sgMail = require('@sendgrid/mail');

const router = express.Router();

//Send Email
router.post('/api/email', requireAuth, async (req, res) => {
	const { to, subject, message } = req?.body;
	let errors = {};
	const emailMessage = subject + ' ' + message;
	const filter = new Filter();
	const isProfane = filter.isProfane(emailMessage);

	if (isProfane) {
		errors.email = 'Email not sent due to use of profanity';
		return res.status(403).json(errors);
	} else {
		try {
			const msg = {
				from: req?.user?.email,
				to,
				subject,
				text: message,
			};
			// Send Msg
			await sgMail.send(msg);
			// Save to db
			const sentMsg = await EmailMsg.create({
				from: req?.user?.email,
				to,
				subject,
				message,
				sentBy: req?.user?._id,
			});
			res.json(sentMsg);
		} catch (err) {
			errors.email = 'Error sending email';
			return res.status(400).json(errors);
		}
	}
});

module.exports = router;
