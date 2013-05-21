(function() {
  var decode, encode, fs, getTempFile, os, path, rice;

  fs = require('fs');

  os = require('os');

  path = require('path');

  rice = require('chunky-rice');

  getTempFile = function(ext) {
    return path.join(os.tmpdir(), "filr-" + (Date.now().toString(36)) + "." + ext);
  };

  encode = function(file, dest, callback) {
    var data, decoder, e, encoder, output, stats;

    try {
      stats = fs.statSync(file);
    } catch (_error) {
      e = _error;
      return;
    }
    if (dest == null) {
      dest = getTempFile('png');
    }
    output = fs.createWriteStream(dest);
    data = fs.readFileSync(file);
    decoder = rice.decode();
    encoder = rice.encode();
    return fs.createReadStream(path.join(__dirname, '../file.png')).pipe(decoder).on('data', function(chunk) {
      if (chunk.type() !== 'IEND') {
        return;
      }
      decoder.emit('data', rice.text('filename', path.basename(file)));
      return decoder.emit('data', rice.text('filedata', data.toString('hex')));
    }).pipe(encoder).on('end', function() {
      return callback(null, dest, stats);
    }).pipe(output);
  };

  decode = function(image, dest, callback) {
    var decoder, input, original, output;

    input = image.pipe ? image : fs.createReadStream(image);
    output = null;
    original = null;
    decoder = rice.decode();
    return input.pipe(decoder).on('data', function(chunk) {
      var ext;

      if (chunk.type() !== 'tEXt') {
        return;
      }
      if (chunk.key() === 'filename') {
        original = chunk.value().toString();
        if (!dest) {
          dest = original;
          ext = path.extname(dest);
          while (fs.existsSync(dest)) {
            dest = "" + (path.basename(original, ext)) + "-" + (Date.now().toString(36)) + ext;
          }
        }
        return output = fs.createWriteStream(dest);
      } else if (chunk.key() === 'filedata') {
        return output.write(new Buffer(chunk.value().toString(), 'hex'));
      }
    }).on('end', function() {
      return callback(null, dest, original);
    });
  };

  module.exports = {
    encode: encode,
    decode: decode
  };

}).call(this);
