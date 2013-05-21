fs       = require 'fs'
path     = require 'path'
program  = require 'commander'

flickr = require './flickr'
png    = require './png'

# -----------------------------------------------------------------------------

program
    .version('0.1.0')
    .usage('[options] <file ...>')
    .option('-d, --decode', 'filr --decode file.png')
    .option('-e, --encode', 'filr --encode file.txt file.png')
    .option('-a, --auth', 'Add API keys [consumer_key] [consumer_secret]')
    .option('-p, --path [path]', 'Path to credentials file', process.env['HOME'] or process.env['USERPROFILE'])
    .parse(process.argv)

config = null


# CLI entry point
# -----------------------------------------------------------------------------

run = (config) ->

    [input_file, output_file] = program.args

    if program.auth
        getToken()
        return

    if program.encode
        png.encode input_file, output_file, (err, file, stats) ->
            console.log "#{stats.size} bytes written to #{file}"
        return

    if program.decode
        png.decode input_file, output_file, (err, file, name) ->
            console.log "Recovered #{name} -> #{file}"
        return

    unless config
        loadConfig path.join(program.path or '', '.filr'), (err, config) ->
            if err then return console.log(
                "Please use filr --auth or edit #{path} to add your API keys."
            )
            run config
        return

    uploadFile(input_file)


# Config file
# -----------------------------------------------------------------------------

loadConfig = (filepath, callback) ->
    fs.readFile filepath, (err, file) ->
        try config = JSON.parse file.toString()

        if !config or !config.consumer_key or !config.consumer_secret
            callback new Error('Missing credentials')
            return

        if !config.token or !config.token_secret
            getTokens config, callback
            return

        callback null, config

getTokens = (config, callback) ->
    flickr.authenticate config, (err, token, token_secret) ->
        if err then return callback err
        config.token = token
        config.token_secret = token_secret
        saveConfig filepath, config
        console.log "Authentication successful!"
        callback null, config

saveConfig = (filepath, config, callback) ->
    fs.writeFile filepath, JSON.stringify(config, null, 4), callback


# Encode file and upload image
# -----------------------------------------------------------------------------

uploadFile = (input) ->
    png.encode input, (err, file, stats) ->
        console.log "Uploading #{input}..."
        flickr.upload config, input, file, stats, (err, res) ->
            if err or res.stat isnt 'ok'
                return console.log "Error uploading file."
           console.log "Photo ID: #{res.photoid}"


# -----------------------------------------------------------------------------

module.exports = {
    run
}
