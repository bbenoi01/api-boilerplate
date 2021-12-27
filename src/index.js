require('./models/User');
require('./models/Post');
require('./models/Comment');
require('./models/EmailMessaging');
require('./models/Category');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const emailMsgRoutes = require('./routes/emailMsgRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL, {
	// useCreateIndex: true,
	// useFindAndModify: true,
	useUnifiedTopology: true,
	useNewUrlParser: true,
});

mongoose.connection.on('connected', () => {
	console.log('Connected to mongo instance.');
});
mongoose.connection.on('error', (err) => {
	console.error('Error connecting to mongo.', err);
});

app.use(userRoutes);
app.use(postRoutes);
app.use(commentRoutes);
app.use(emailMsgRoutes);
app.use(categoryRoutes);

app.listen(process.env.PORT || 3005, () => {
	console.log('Listening on port 3005');
});
