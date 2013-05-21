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
    return fs.createReadStream('file.png').pipe(decoder).on('data', function(chunk) {
      if (chunk.type() !== 'IEND') {
        return;
      }
      decoder.emit('data', rice.text('filename', path.basename(file)));
      return decoder.emit('data', rice.text('filedata', data.toString('hex')));
    }).pipe(encoder).pipe(output).on('end', function() {
      return callback(null, dest, stats);
    });
  };

  decode = function(image, dest, callback) {
    var decoder, input, original, output;

    if (dest == null) {
      dest = getTempFile('dat');
    }
    original = null;
    input = fs.createReadStream(image);
    output = fs.createWriteStream(dest);
    decoder = rice.decode();
    return input.pipe(decoder).on('data', function(chunk) {
      if (chunk.type() !== 'tEXt') {
        return;
      }
      switch (chunk.key()) {
        case 'filename':
          return original = chunk.value().toString();
        case 'filedata':
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
