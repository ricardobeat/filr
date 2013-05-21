(function() {
  var config, configPath, downloadFile, flickr, fs, getTokens, http, loadConfig, path, png, program, qs, request, run, saveConfig, uploadFile;

  fs = require('fs');

  qs = require('querystring');

  path = require('path');

  http = require('http');

  program = require('commander');

  request = require('request');

  flickr = require('./flickr');

  png = require('./png');

  program.version('0.1.0').usage('<file ...>').option('-d, --decode', 'filr --decode file.png').option('-e, --encode', 'filr --encode file.txt file.png').option('-a, --auth', 'Add API keys [consumer_key] [consumer_secret]').option('-g, --get', 'Get file from Flickr by URL').option('-p, --path [path]', 'Path to credentials file', process.env['HOME'] || process.env['USERPROFILE']).parse(process.argv);

  configPath = path.join(program.path || '', '.filr');

  config = {};

  run = function() {
    var file, input_file, output_file, _i, _len, _ref, _ref1, _results;

    _ref = program.args, input_file = _ref[0], output_file = _ref[1];
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
    if (!config.consumer_key) {
      loadConfig(configPath, function(err) {
        if (err) {
          return console.log("Please use filr --auth or edit " + configPath + " to add your API keys.");
        }
        return run();
      });
      return;
    }
    flickr.createClient(config);
    if (program.auth) {
      config.consumer_key = program.args[0] || config.consumer_key;
      config.consumer_secret = program.args[1] || config.consumer_secret;
      getTokens();
      return;
    }
    if (program.get) {
      downloadFile(input_file, output_file, function(err, file, name) {
        if (err) {
          return console.error("Error downloading file.");
        }
        return console.log("Recovered " + name + " -> " + file);
      });
    }
    if (program.args.length) {
      _ref1 = program.args;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        file = _ref1[_i];
        _results.push(uploadFile(input_file));
      }
      return _results;
    } else {
      return program.help();
    }
  };

  loadConfig = function(filepath, callback) {
    return fs.readFile(filepath, function(err, file) {
      var config2, key, val;

      try {
        config2 = JSON.parse(file.toString());
      } catch (_error) {}
      for (key in config2) {
        val = config2[key];
        config[key] || (config[key] = val);
      }
      if (!config || !config.consumer_key || !config.consumer_secret) {
        callback(new Error('Please supply your CONSUMER_KEY and CONSUMER_SECRET'));
        return;
      }
      if (!config.token || !config.token_secret) {
        getTokens(callback);
        return;
      }
      return callback(null);
    });
  };

  getTokens = function(callback) {
    flickr.createClient(config);
    return flickr.authenticate(function(err, token, token_secret) {
      if (err) {
        return callback(err);
      }
      config.token = token;
      config.token_secret = token_secret;
      saveConfig();
      console.log("Authentication successful!");
      return typeof callback === "function" ? callback(null) : void 0;
    });
  };

  saveConfig = function(callback) {
    return fs.writeFileSync(configPath, JSON.stringify(config, null, 4), callback);
  };

  uploadFile = function(input) {
    return png.encode(input, null, function(err, file, stats) {
      console.log("Uploading " + input + "...");
      return flickr.upload(input, file, stats, function(err, res) {
        if (err || res.stat !== 'ok') {
          return console.log("Error uploading file.");
        }
        return console.log("" + file + " upload completed. Photo ID: " + res.photoid);
      });
    });
  };

  downloadFile = function(url, dest, callback) {
    var matches, photo_id;

    if (matches = url.match(/\w+\/(\d+)/)) {
      url = "http://flickr.com/photos/" + matches[0];
      photo_id = matches[1];
    }
    return flickr.api('flickr.photos.getSizes', {
      photo_id: photo_id
    }, function(err, res) {
      var original, _ref;

      if (err) {
        return callback(err);
      }
      original = res != null ? (_ref = res.sizes) != null ? _ref.size.filter(function(s) {
        return s.label === 'Original';
      }) : void 0 : void 0;
      if (!(original = original != null ? original[0] : void 0)) {
        return callback(new Error());
      }
      return http.get(original.source, function(res) {
        var last, progress, size;

        progress = 0;
        size = res.headers['content-length'];
        last = 0;
        res.on('data', function(chunk) {
          var percent;

          progress += chunk.length;
          percent = (progress / size * 100).toFixed(2);
          if (percent - last > 20) {
            console.log("" + percent + "%");
            return last = percent;
          }
        });
        return png.decode(res, dest, callback);
      });
    });
  };

  module.exports = {
    run: run
  };

}).call(this);
