var nock                      = require('nock');

// Result files
var facebookPostsJson         = require('../json/facebook/posts.json');
var facebookPostsSinceJson	  = require('../json/facebook/postsSince.json');
var facebookFqlLikesJson      = require('../json/facebook/fqlLikes.json');
var facebookNotificationsJson = require('../json/facebook/notifications.json');
var facebookCallback		  = require('../json/facebook/callback.json');
var facebookUserInfo		  = require('../json/facebook/userInfo.json');
var facebookPagesJson		  = require('../json/facebook/pages.json');
var instagramPostsJson        = require('../json/instagram/posts.json');
var tumblrPostsJson           = require('../json/tumblr/posts.json');
var twitterPostsJson          = require('../json/twitter/posts.json');
var twitterPostsSinceJson	  = require('../json/twitter/postsSince.json');
var twitterNotificationsJson  = require('../json/twitter/notifications.json');
var youtubePostsJson          = require('../json/youtube/posts.json');

// To record requests, enable this
//nock.recorder.rec();

/**
 * FACEBOOK
 */
// Popup Request, redirect to the popup final url
nock('https://graph.facebook.com')
	.persist()
	.filteringPath(/access_token\?code=[^&\n]*&client_id=[^&\n]*&client_secret=[^&\n]*&redirect_uri=[^&\n]*&grant_type=[^&\n]*/g, 'access_token?code=OAUTHCODEV1&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URL&grant_type=GRANT_TYPE')
	.post('/v2.1/oauth/access_token?code=OAUTHCODEV1&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&redirect_uri=REDIRECT_URL&grant_type=GRANT_TYPE')
	.reply(200, facebookCallback.response);

// User info
nock('https://graph.facebook.com')
	.persist()
	.filteringPath(/access_token=[^&\n]*/g, 'access_token=ACCESS_TOKEN')
	.get('/v2.1/me?access_token=ACCESS_TOKEN')
	.reply(200, facebookUserInfo);

// Home Feed
nock('https://graph.facebook.com')
	.persist()
	.filteringPath(/access_token=[^&\n]*&fields=[^&\n]*(&limit=30)?(&until=[^&\n]*)?/g, 'access_token=MATCH_ACCESS_TOKEN&fields=MATCH_FIELDS&limit=30&since=MATCH_SINCE&until=MATCH_UNTIL')
	.get('/v2.1/me/home?access_token=MATCH_ACCESS_TOKEN&fields=MATCH_FIELDS&limit=30&since=MATCH_SINCE&until=MATCH_UNTIL')
	.reply(200, facebookPostsJson);

nock('https://graph.facebook.com')
	.persist()
	.filteringPath(/access_token=[^&\n]*&fields=[^&\n]*(&limit=30)?(&since=[^&\n]*)?(&until=[^&\n]*)?/g, 'access_token=MATCH_ACCESS_TOKEN&fields=MATCH_FIELDS&limit=30&since=MATCH_SINCE&until=MATCH_UNTIL')
	.get('/v2.1/me/home?access_token=MATCH_ACCESS_TOKEN&fields=MATCH_FIELDS&limit=30&since=MATCH_SINCE&until=MATCH_UNTIL')
	.reply(200, facebookPostsSinceJson);

// Likes FQL Query
nock('https://graph.facebook.com')
	.persist()
	.filteringPath(/access_token=[^&\n]*&q=[^&\n]*/g, 'access_token=MATCH_ACCESS_TOKEN&q=MATCH_Q')
	.get('/v2.1/fql?access_token=MATCH_ACCESS_TOKEN&q=MATCH_Q')
	.reply(200, facebookFqlLikesJson);

// Notifications
nock('https://graph.facebook.com')
	.persist()
    .filteringPath(/access_token=[^&\n]*&include_read=true&fields=[^&\n]*/g, 'access_token=ACCESS_TOKEN&include_read=true&fields=FIELDS')
    .get('/v2.1/me/notifications?access_token=ACCESS_TOKEN&include_read=true&fields=FIELDS')
	.reply(200, facebookNotificationsJson);

// Pages
nock('https://graph.facebook.com')
	.persist()
	.filteringPath(/access_token=[^&\n]*/g, 'access_token=MATCH_ACCESS_TOKEN')
	.get('/v2.1/me/accounts?access_token=MATCH_ACCESS_TOKEN')
	.reply(200, facebookPagesJson);

/**
 * INSTAGRAM
 */
// User Feed
nock('https://api.instagram.com')
	.persist()
	.filteringPath(/access_token=[^&\n]*&count=[^&\n]*/g, 'access_token=ACCESS_TOKEN&count=COUNT')
	.get('/v1/users/self/feed?access_token=ACCESS_TOKEN&count=COUNT')
	.reply(200, instagramPostsJson);

/**
 * TWITTER
 */
// Home Timeline
nock('https://api.twitter.com:443')
	.persist()
	.filteringPath(/count=[^&\n]*&include_rts=[^&\n]*/g, 'count=COUNT&include_rts=INCLUDE_RTS')
	.get('/1.1/statuses/home_timeline.json?count=COUNT&include_rts=INCLUDE_RTS')
	.reply(200, twitterPostsJson);

nock('https://api.twitter.com:443')
	.persist()
	.filteringPath(/count=[^&\n]*&include_rts=[^&\n]*&since_id=[^&\n]*/g, 'count=COUNT&include_rts=INCLUDE_RTS&since_id=SINCEID')
	.get('/1.1/statuses/home_timeline.json?count=COUNT&include_rts=INCLUDE_RTS&since_id=SINCEID')
	.reply(200, twitterPostsSinceJson);

// Mentions Timeline (used for notifications)
nock('https://api.twitter.com:443')
	.persist()
    .filteringPath(/count=[^&\n]*&include_rts=[^&\n]*/g, 'count=COUNT&include_rts=INCLUDE_RTS')
    .get('/1.1/statuses/mentions_timeline.json?count=COUNT&include_rts=INCLUDE_RTS')
    .reply(200, twitterNotificationsJson);

/**
 * TUMBLR
 */
// User Feed
nock('http://api.tumblr.com')
	.persist()
	.filteringPath(/limit=[^&\n]*&reblog_info=[^&\n]*/g, 'limit=30&reblog_info=true')
	.get('/v2/user/dashboard?limit=30&reblog_info=true')
	.reply(200, tumblrPostsJson);

/**
 * YOUTUBE
 */
// User Feed
nock('https://gdata.youtube.com')
	.persist()
	.filteringPath(/users\/[^&\n]*\/newsubscriptionvideos\?alt=json&orderby=published&access_token=[^&\n]*/g, 'users/UCdSyeBzNs_wJ1UIPzBMAQ/newsubscriptionvideos?alt=json&orderby=published&access_token=ACCESS_TOKEN')
	.get('/feeds/api/users/UCdSyeBzNs_wJ1UIPzBMAQ/newsubscriptionvideos?alt=json&orderby=published&access_token=ACCESS_TOKEN')
	.reply(200, youtubePostsJson);
