(function() {
  var Flickr, OAuth, api, authenticate, cp, createClient, flickr, fs, path, program, upload;

  path = require('path');

  fs = require('fs');

  cp = require('child_process');

  program = require('commander');

  Flickr = require('flickr-with-uploads').Flickr;

  OAuth = require('OAuth');

  flickr = null;

  createClient = function(keys) {
    return flickr = new Flickr(keys.consumer_key, keys.consumer_secret, keys.token, keys.token_secret);
  };

  authenticate = function(callback) {
    var oauth;

    oauth = new OAuth.OAuth('http://www.flickr.com/services/oauth/request_token', 'http://www.flickr.com/services/oauth/access_token', flickr.consumer_key, flickr.consumer_secret, '1.0A', 'oob', 'HMAC-SHA1');
    return oauth.getOAuthRequestToken({}, function(err, token, token_secret, results) {
      var url;

      url = "http://www.flickr.com/services/oauth/authorize?oauth_token=" + token;
      cp.exec("open " + url);
      console.log("Open " + url + " in a browser");
      return program.prompt("PIN: ", function(pin) {
        return oauth.getOAuthAccessToken(token, token_secret, pin, function(err, token, token_secret, results) {
          process.stdin.destroy();
          return callback(err, token, token_secret);
        });
      });
    });
  };

  upload = function(filename, file, stats, callback) {
    var data;

    data = {
      title: path.basename(filename),
      description: "" + stats.size + " bytes",
      is_public: 0,
      hidden: 2,
      photo: fs.createReadStream(file)
    };
    return flickr.createRequest('upload', data, true, callback).send();
  };

  api = function(endpoint, data, callback) {
    return flickr.createRequest(endpoint, data, true, callback).send();
  };

  module.exports = {
    createClient: createClient,
    authenticate: authenticate,
    upload: upload,
    api: api
  };

}).call(this);
