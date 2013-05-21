Filr
==========

Filr turns Flickr into a storage engine. Very useful now that [everyone gets 1TB for free](yahoo.tumblr.com/post/50934634700/your-world-in-full-resolution) :)

<a href="http://www.youtube.com/watch?v=Z3CBFZTlwJ4&amp;vq=hd720" target="_blank"><img src="http://f.cl.ly/items/0e272s1r1j3i3k111U0i/Screen%20Shot%202013-05-21%20at%206.44.35%20AM.png" /></a>

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

    filr --encode radiohead.mp3 radio.png
    
    filr --decode radio.png radiohead.mp3


How it works / caveats
----------------------

Files are encoded as hex strings and saved as a tEXt chunk inside the PNG, so the actual image could be anything. Flickr preserves the original data intact in the "Original" size.

Unfortunately this method is very wasteful, resulting in file sizes 2-4x the original. PNG does support "zEXt" chunks which are compressed using zlib, but the libraries being used here don't. Even better (and more cool) would be to save data in the image itself [as seen here](http://blog.nihilogic.dk/2008/05/compression-using-canvas-and-png.html).

There is probably a restriction on chunk sizes that will cause this to break on larger files, I have only tested up to 15mb.

To-do
-----

- upload folders
- add images to separate set
- match file icons by filetype?
- custom base image
- bitmap mode (save data as grayscale bitmap)

### License

http://ricardo.mit-license.org
