fs   = require 'fs'
os   = require 'os'
path = require 'path'
rice = require 'chunky-rice'

getTempFile = (ext) ->
    path.join(os.tmpdir(), "filr-#{Date.now().toString(36)}.#{ext}")

# Encode data into PNG
# -----------------------------------------------------------------------------

encode = (file, dest, callback) ->
    try stats = fs.statSync file
    catch e then return

    dest ?= getTempFile('png')

    output = fs.createWriteStream dest
    data   = fs.readFileSync file

    decoder = rice.decode()
    encoder = rice.encode()

    fs.createReadStream('file.png')
        .pipe(decoder)
        .on('data', (chunk) ->
            return if chunk.type() isnt 'IEND'
            decoder.emit 'data', rice.text('filename', path.basename(file))
            decoder.emit 'data', rice.text('filedata', data.toString('hex'))
        )
        .pipe(encoder)
        .pipe(output)
        .on('end', -> callback null, dest, stats)


# Retrieve data from PNG
# -----------------------------------------------------------------------------

decode = (image, dest, callback) ->

    dest ?= getTempFile('dat')
    original = null

    input  = fs.createReadStream image
    output = fs.createWriteStream dest

    decoder = rice.decode()

    input
        .pipe(decoder)
        .on('data', (chunk) ->
            return if chunk.type() isnt 'tEXt'
            switch chunk.key()
                when 'filename' then original = chunk.value().toString()
                when 'filedata' then output.write new Buffer(chunk.value().toString(), 'hex')
        )
        .on('end', -> callback null, dest, original)


# -----------------------------------------------------------------------------

module.exports = {
    encode
    decode
}
