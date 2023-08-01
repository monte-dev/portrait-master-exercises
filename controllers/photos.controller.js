const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
	try {
		const { title, author, email } = req.fields;
		const file = req.files.file;

		if (title && author && email && file) {
			// if fields are not empty...
			const regex = new RegExp(
				/(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/,
				'g'
			);
			const validTitle = title.match(regex).join('');
			const validAuthor = author.match(regex).join('');

			const emailRegex = new RegExp('[a-z0-9]+@[a-z]+.[a-z]{2,3}');
			const validEmail = email.match(emailRegex);

			const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
			const fileExtension = fileName.path.split('.').slice(-1)[0];

			if (
				(fileExtension === 'jpg' ||
					fileExtension === 'png' ||
					fileExtension === 'gif') &&
				validEmail &&
				validTitle &&
				validAuthor
			) {
				const newPhoto = new Photo({
					title,
					author,
					email,
					src: fileName,
					votes: 0,
				});
				await newPhoto.save(); // ...save new photo in DB
				res.json(newPhoto);
			}
		} else {
			throw new Error('Wrong input!');
		}
	} catch (err) {
		res.status(500).json(err);
	}
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
	try {
		res.json(await Photo.find());
	} catch (err) {
		res.status(500).json(err);
	}
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
	try {
		const clientIp = requestIp.getClientIp(req);
		const voter = await Voter.findOne({ user: clientIp });
		const photoToUpdate = await Photo.findById(req.params.id);

		if (!voter) {
			const newVoter = new Voter({
				user: clientIp,
				votes: [req.params.id],
			});
			await newVoter.save();
		} else {
			if (voter.votes.includes(req.params.id)) {
				console.log('already voted');
				return res.status(500).json({
					message: 'You have already voted...',
				});
			} else {
				voter.votes.push(req.params.id);
				photoToUpdate.votes++;
				await voter.save();
			}
		}
		await photoToUpdate.save();
		res.send({ message: 'OK' });
	} catch (err) {
		res.status(500).json(err);
	}
};
