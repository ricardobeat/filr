(function() {
  var Flickr, OAuth, authenticate, cp, fs, path, program, upload;

  path = require('path');

  fs = require('fs');

  cp = require('child_process');

  program = require('commander');

  Flickr = require('flickr-with-uploads').Flickr;

  OAuth = require('OAuth');

  authenticate = function(keys, callback) {
    var oauth;

    oauth = new OAuth.OAuth('http://www.flickr.com/services/oauth/request_token', 'http://www.flickr.com/services/oauth/access_token', keys.consumer_key, keys.consumer_secret, '1.0A', 'oob', 'HMAC-SHA1');
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

  upload = function(keys, filename, file, stats, callback) {
    var data, flickr;

    flickr = new Flickr(keys.consumer_key, keys.consumer_secret, keys.token, keys.token_secret);
    data = {
      title: path.basename(filename),
      description: "" + stats.size + " bytes",
      is_public: 0,
      hidden: 2,
      photo: fs.createReadStream(file)
    };
    return flickr.createRequest('upload', data, true, callback).send();
  };

  module.exports = {
    authenticate: authenticate,
    upload: upload
  };

}).call(this);
