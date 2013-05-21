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
        .on('end', -> callback null, dest, stats)
        .pipe(output)


# Retrieve data from PNG
# -----------------------------------------------------------------------------

decode = (image, dest, callback) ->

    input    = if image.pipe then image else fs.createReadStream image
    output   = null
    original = null

    decoder = rice.decode()

    input
        .pipe(decoder)
        .on('data', (chunk) ->
            return if chunk.type() isnt 'tEXt'

            if chunk.key() is 'filename'
                if !dest
                    dest = original = chunk.value().toString()
                    ext = path.extname(dest)
                    # Avoid overwriting local files
                    while fs.existsSync dest
                        dest = "#{path.basename(original, ext)}-#{Date.now().toString(36)}#{ext}"
                output = fs.createWriteStream dest

            else if chunk.key() is 'filedata'
                output.write new Buffer(chunk.value().toString(), 'hex')
        )
        .on 'end', ->
            callback null, dest, original


# -----------------------------------------------------------------------------

module.exports = {
    encode
    decode
}
