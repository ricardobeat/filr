path     = require 'path'
fs       = require 'fs'
cp       = require 'child_process'
program  = require 'commander'
{Flickr} = require 'flickr-with-uploads'
OAuth    = require 'OAuth'

# -----------------------------------------------------------------------------

flickr = null

createClient = (keys) ->
    flickr = new Flickr(
        keys.consumer_key
        keys.consumer_secret
        keys.token
        keys.token_secret
    )


# Get OAuth tokens
# -----------------------------------------------------------------------------

authenticate = (keys, callback) ->

    oauth = new OAuth.OAuth(
        'http://www.flickr.com/services/oauth/request_token'
        'http://www.flickr.com/services/oauth/access_token'
        keys.consumer_key
        keys.consumer_secret
        '1.0A'
        'oob'
        'HMAC-SHA1'
    )

    oauth.getOAuthRequestToken {}, (err, token, token_secret, results) ->
        url = "http://www.flickr.com/services/oauth/authorize?oauth_token=#{token}"
        cp.exec("open #{url}")
        console.log "Open #{url} in a browser"
        program.prompt "PIN: ", (pin) ->
            oauth.getOAuthAccessToken token, token_secret, pin, (err, token, token_secret, results) ->
                process.stdin.destroy();
                callback err, token, token_secret


# Upload image
# -----------------------------------------------------------------------------

upload = (filename, file, stats, callback) ->
    data = {
        title: path.basename(filename)
        description: "#{stats.size} bytes"
        is_public: 0
        hidden: 2
        photo: fs.createReadStream(file)
    }

    flickr.createRequest('upload', data, true, callback).send()


# API
# -----------------------------------------------------------------------------

api = (endpoint, data, callback) ->
    flickr.createRequest(endpoint, data, true, callback).send()


# -----------------------------------------------------------------------------

module.exports = {
    createClient
    authenticate
    upload
    api
}
