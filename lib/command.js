(function() {
  var config, flickr, fs, getTokens, loadConfig, path, png, program, run, saveConfig, uploadFile;

  fs = require('fs');

  path = require('path');

  program = require('commander');

  flickr = require('./flickr');

  png = require('./png');

  program.version('0.1.0').usage('[options] <file ...>').option('-d, --decode', 'filr --decode file.png').option('-e, --encode', 'filr --encode file.txt file.png').option('-a, --auth', 'Add API keys [consumer_key] [consumer_secret]').option('-p, --path [path]', 'Path to credentials file', process.env['HOME'] || process.env['USERPROFILE']).parse(process.argv);

  config = null;

  run = function(config) {
    var input_file, output_file, _ref;

    _ref = program.args, input_file = _ref[0], output_file = _ref[1];
    if (program.auth) {
      getToken();
      return;
    }
    if (program.encode) {
      png.encode(input_file, output_file, function(err, file, stats) {
        return console.log("" + stats.size + " bytes written to " + file);
      });
      return;
    }
    if (program.decode) {
      png.decode(input_file, output_file, function(err, file, name) {
        return console.log("Recovered " + name + " -> " + file);
      });
      return;
    }
    if (!config) {
      loadConfig(path.join(program.path || '', '.filr'), function(err, config) {
        if (err) {
          return console.log("Please use filr --auth or edit " + path + " to add your API keys.");
        }
        return run(config);
      });
      return;
    }
    return uploadFile(input_file);
  };

  loadConfig = function(filepath, callback) {
    return fs.readFile(filepath, function(err, file) {
      try {
        config = JSON.parse(file.toString());
      } catch (_error) {}
      if (!config || !config.consumer_key || !config.consumer_secret) {
        callback(new Error('Missing credentials'));
        return;
      }
      if (!config.token || !config.token_secret) {
        getTokens(config, callback);
        return;
      }
      return callback(null, config);
    });
  };

  getTokens = function(config, callback) {
    return flickr.authenticate(config, function(err, token, token_secret) {
      if (err) {
        return callback(err);
      }
      config.token = token;
      config.token_secret = token_secret;
      saveConfig(filepath, config);
      console.log("Authentication successful!");
      return callback(null, config);
    });
  };

  saveConfig = function(filepath, config, callback) {
    return fs.writeFile(filepath, JSON.stringify(config, null, 4), callback);
  };

  uploadFile = function(input) {
    return png.encode(input, function(err, file, stats) {
      console.log("Uploading " + input + "...");
      flickr.upload(config, input, file, stats, function(err, res) {
        if (err || res.stat !== 'ok') {
          return console.log("Error uploading file.");
        }
      });
      return console.log("Photo ID: " + res.photoid);
    });
  };

  module.exports = {
    run: run
  };

}).call(this);
