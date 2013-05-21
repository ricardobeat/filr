Filr
==========

Filr turns Flickr into a storage engine. Very useful now that [everyone gets 1TB for free](yahoo.tumblr.com/post/50934634700/your-world-in-full-resolution) :)

Authorization
--------------

First, create an app at http://www.flickr.com/services/apps/create/ and take note of your consumer keys.

    # Add your keys
    filr --auth CONSUMER_KEY CONSUMER_SECRET

Complete the OAuth flow to obtain access tokens. Filr will attempt to open a browser for you, just enter the resulting PIN on the prompt that follows. Tokens are persisted to `$HOME/.filr`.

Uploading
----------

    filr my_file1.txt my_file2.txt

Each file will be uploaded as a separate image. Resulting images are set to private so they won't show on your public photostream.

Encoding / decoding
-------------------

The encode/decode functionality is exposed as 

    filr --encode gangnam.mp3 

How it works / caveats
----------------------

Files are encoded as hex strings and saved as a tEXt chunk inside the PNG. Flickr preserves the original intact.

Unfortunately that is very wasteful, resulting in file sizes 2-4x the original. PNG does support "zEXt" chunks which are compressed using zlib, but the libraries being used here don't. Even better (and more cool) would be to save data in the image itself [as seen here](http://blog.nihilogic.dk/2008/05/compression-using-canvas-and-png.html).

There is probably a restriction on chunk sizes that will cause this to break on larger files.

### License

http://ricardo.mit-license.org