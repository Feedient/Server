var Joi = require('joi');

var schema = Joi.object({
	id: Joi.string().required(),
	post_link: Joi.string().required(),
	user: Joi.object({
		id: Joi.string().required(),
		name: Joi.string().required(),
		name_formatted: Joi.string(),
		image: Joi.string(),
		profile_link: Joi.string().required()
	}).required(),
	provider: Joi.object({
		id: Joi.string().required(),
		name: Joi.string().required()
	}).required(),
	content: Joi.object({
		action: Joi.object({
			type: Joi.string(),
			message: Joi.string(),
			user: Joi.object({
				id: Joi.string(),
				name: Joi.string(),
				name_formatted: Joi.string(),
				image: Joi.string(),
				profile_link: Joi.string()
			})
		}),
		message: Joi.string().allow(""),
		date_created: Joi.date(),
		entities: Joi.object({
			links: Joi.array(),
			pictures: Joi.array(),
			hashtags: Joi.array(),
			videos: Joi.array(),
			mentions: Joi.array(),
			place: Joi.object({
				url: Joi.string(),
				name: Joi.string()
			}),
			extended_link: Joi.object({
				name: Joi.string(),
				description: Joi.string(),
				url: Joi.string(),
				image: Joi.string()
			}),
			extended_video: Joi.object({
				link: Joi.string(),
				thumbnail: Joi.string(),
				title: Joi.string(),
				description: Joi.string(),
				duration: Joi.string()
			})
		}),
		action_counts: Joi.object({
			// Facebook
			likes: Joi.number(),
			shares: Joi.number(),
			comments: Joi.number(),

			// YouTube
			views: Joi.string(),
			dislikes: Joi.number(),

			// Twitter
			retweets: Joi.number(),
			replies: Joi.number(),
			favorites: Joi.number(),

			// Tumblr
			notes: Joi.number()
		}),
		actions_performed: Joi.object({
			liked: Joi.boolean(),
			disliked: Joi.boolean(),
			shared: Joi.boolean(),
			commented: Joi.boolean(),
			retweeted: Joi.boolean(),
			favorited: Joi.boolean()
		}),
		// Provider specific
		original_id: Joi.string(),

		// Twitter
		is_conversation: Joi.boolean()
	}).required(),
	twitter: Joi.object({
		in_reply_to_status_id_str: Joi.string().allow('').allow(null)
	}),
	tumblr: Joi.object({
		reblog_key: Joi.string(),
		post_type: Joi.string()
	}),
	pagination: Joi.object({
		since: Joi.string().required()
	}).required(),
	// Twitter Original Id
	original_id: Joi.string(),
	// YouTube pagination ID
	pagination_id: Joi.number()
});

module.exports = schema;
