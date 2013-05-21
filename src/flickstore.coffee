program = require 'commander'
fs      = require 'fs'
rice    = require 'chunky-rice'

program
  .version('0.1.0')
  .usage('[options] <file ...>')
  .option('-d, --decode', 'Read data from PNG file')
  .parse(process.argv)


exports.run = ->
    if program.decode
        [input, output] = program.args
        @decode input, output, ->
            console.log "Data written to #{output}"
        return

    [input] = program.args
    @encode input, ->
        console.log "Data written to #{output}"

    file = program.args[0]

# Encode data into PNG
exports.encode = (file, callback) ->
    try stats = fs.statSync file
    catch e then return

    data   = fs.readFileSync file
    size   = stats.size
    width  = Math.ceil Math.sqrt(size)
    height = width

    out_file = Date.now().toString(36) + '.png'
    output = fs.createWriteStream out_file

    decoder = rice.decode()
    encoder = rice.encode()

    fs.createReadStream('file.png')
        .pipe(decoder)
        .on('data', (chunk) ->
            return if chunk.type() isnt 'IEND'
            decoder.emit 'data', rice.text('filename', file)
            decoder.emit 'data', rice.text('filedata', data.toString('hex'))
        )
        .pipe(encoder)
        .pipe(output)
        .on('end', -> callback null, out_file)

# Retrieve data from PNG
exports.decode = (image, dest, callback) ->

    input  = fs.createReadStream image
    output = fs.createWriteStream dest

    decoder = rice.decode()

    input
        .pipe(decoder)
        .on('data', (chunk) ->
            return if chunk.type() isnt 'tEXt'
            output.write new Buffer(chunk.value().toString(), 'hex')
        )
        .on('end', callback)
