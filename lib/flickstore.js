(function() {
  var fs, program, rice;

  program = require('commander');

  fs = require('fs');

  rice = require('chunky-rice');

  program.version('0.1.0').usage('[options] <file ...>').option('-d, --decode', 'Read data from PNG file').parse(process.argv);

  exports.run = function() {
    var file, input, output, _ref;

    if (program.decode) {
      _ref = program.args, input = _ref[0], output = _ref[1];
      this.decode(input, output, function() {
        return console.log("Data written to " + output);
      });
      return;
    }
    input = program.args[0];
    this.encode(input, function() {
      return console.log("Data written to " + output);
    });
    return file = program.args[0];
  };

  exports.encode = function(file, callback) {
    var data, decoder, e, encoder, height, out_file, output, size, stats, width;

    try {
      stats = fs.statSync(file);
    } catch (_error) {
      e = _error;
      return;
    }
    data = fs.readFileSync(file);
    size = stats.size;
    width = Math.ceil(Math.sqrt(size));
    height = width;
    out_file = Date.now().toString(36) + '.png';
    output = fs.createWriteStream(out_file);
    decoder = rice.decode();
    encoder = rice.encode();
    return fs.createReadStream('base.png').pipe(decoder).on('data', function(chunk) {
      if (chunk.type() !== 'IEND') {
        return;
      }
      decoder.emit('data', rice.text('filename', file));
      return decoder.emit('data', rice.text('filedata', data.toString('hex')));
    }).pipe(encoder).pipe(output).on('end', function() {
      return callback(null, out_file);
    });
  };

  exports.decode = function(image, dest, callback) {
    var decoder, input, output;

    input = fs.createReadStream(image);
    output = fs.createWriteStream(dest);
    decoder = rice.decode();
    return input.pipe(decoder).on('data', function(chunk) {
      if (chunk.type() !== 'tEXt') {
        return;
      }
      return output.write(new Buffer(chunk.value().toString(), 'hex'));
    }).on('end', callback);
  };

}).call(this);
