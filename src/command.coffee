fs       = require 'fs'
qs       = require 'querystring'
path     = require 'path'
http     = require 'http'
program  = require 'commander'
request  = require 'request'

flickr = require './flickr'
png    = require './png'

# -----------------------------------------------------------------------------

program
    .version('0.1.0')
    .usage('<file ...>')
    .option('-d, --decode', 'filr --decode file.png')
    .option('-e, --encode', 'filr --encode file.txt file.png')
    .option('-a, --auth', 'Add API keys [consumer_key] [consumer_secret]')
    .option('-g, --get', 'Get file from Flickr by URL')
    .option('-p, --path [path]', 'Path to credentials file', process.env['HOME'] or process.env['USERPROFILE'])
    .parse(process.argv)

configPath = path.join(program.path or '', '.filr')
config = {}

# CLI entry point
# -----------------------------------------------------------------------------

run = ->

    [input_file, output_file] = program.args

    if program.encode
        png.encode input_file, output_file, (err, file, stats) ->
            console.log "#{stats.size} bytes written to #{file}"
        return

    if program.decode
        png.decode input_file, output_file, (err, file, name) ->
            console.log "Recovered #{name} -> #{file}"
        return

    if program.auth
        [config.consumer_key, config.consumer_secret] = program.args
        getTokens (err) ->
            return unless err
            console.log "Failed to obtain access token.\n#{JSON.stringify(config, null, 4)}"
            console.log err
        return

    # Methods below this need API keys
    unless config.consumer_key
        loadConfig configPath, (err) ->
            if err then return console.log(
                "Please use filr --auth or edit #{configPath} to add your API keys."
            )
            run()
        return

    flickr.createClient(config)

    if program.get
        downloadFile input_file, output_file, (err, file, name) ->
            if err then return console.error "Error downloading file."
            console.log "Recovered #{name} -> #{file}"

    if program.args.length
        uploadFile(file) for file in program.args
    else
        program.help()


# Config file
# -----------------------------------------------------------------------------

loadConfig = (filepath, callback) ->
    fs.readFile filepath, (err, file) ->
        try config2 = JSON.parse file.toString()
        config[key] or= val for key, val of config2

        if !config or !config.consumer_key or !config.consumer_secret
            callback new Error('Please supply your CONSUMER_KEY and CONSUMER_SECRET')
            return

        if !config.token or !config.token_secret
            getTokens callback
            return

        callback null

getTokens = (callback) ->
    flickr.createClient(config)
    flickr.authenticate (err, token, token_secret) ->
        if err then return callback err
        config.token = token
        config.token_secret = token_secret
        saveConfig()
        console.log "Authentication successful!"
        callback? null

saveConfig = (callback) ->
    fs.writeFileSync configPath, JSON.stringify(config, null, 4), callback


# Encode file and upload image
# -----------------------------------------------------------------------------

uploadFile = (input) ->
    png.encode input, null, (err, file, stats) ->
        console.log "Uploading #{input}..."
        flickr.upload input, file, stats, (err, res) ->
            if err or res.stat isnt 'ok'
                return console.log "Error uploading file."
            console.log "#{input} uploaded. Photo ID: #{res.photoid}"


# Download image and decode back to file
# -----------------------------------------------------------------------------

downloadFile = (url, dest, callback) ->
    if matches = url.match(/\w+\/(\d+)/)
        url = "http://flickr.com/photos/#{matches[0]}"
        photo_id = matches[1]

    flickr.api 'flickr.photos.getSizes', { photo_id }, (err, res) ->
        return callback err if err

        original = res?.sizes?.size.filter (s) -> s.label is 'Original'
        return callback new Error() unless original = original?[0]

        http.get original.source, (res) ->
            progress = 0
            size = res.headers['content-length']
            last = 0

            res.on 'data', (chunk) ->
               progress += chunk.length
               percent = (progress / size * 100).toFixed(2)
               if percent - last > 20
                    console.log "#{percent}%"
                    last = percent

            png.decode res, dest, callback


# -----------------------------------------------------------------------------

module.exports = {
    run
}
