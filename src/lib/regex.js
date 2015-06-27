var linkRegex	 = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
var hashtagRegex = /\S*#(?:\[[^\]]+\]|\S+)/ig;

exports.getLinks = function(text) {
	return text.match(linkRegex);
};

exports.getHashtags = function(text) {
	return text.match(hashtagRegex);
};
