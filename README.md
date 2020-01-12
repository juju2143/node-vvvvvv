# node-vvvvvv

This is a node package to deal with the custom file formats from Terry Cavanagh's popular game VVVVVV.

## Usage

### Music

There's a file called `vvvvvvmusic.vvv` in the root of the `data.zip` found in your installation of VVVVVV.

It's a quite simple file format. From the source code:

```c
struct resourceheader
{
	char name[48]; // Name of the file, null-terminated
	int start; // actually unused, most likely the offset where to find this file, but the code just goes with filesizes and as a result this field contains garbage
	int size; // size of the file
	bool valid; // 1 if this header block is valid, otherwise it contains garbage and should be ignored
};
```

There is 128 of such header blocks, then every file is concatenated together.

Here's some examples of Node.js code:

```js
const { vvv } = require('vvvvvv');
const fs = require('fs');

// open a file
fs.readFile(filename, (err, data) => {
    if(err) throw err;

    // read the header and get a list of files
    vvv.list(data, (err, files) => {
        if(err) throw err;
        files.forEach(file => {
            console.log("%d\t%s", file.size, file.name);
        });
    })

    // like vvv.list but the callback runs for every file and a buffer is included
    vvv.unpack(data, (err, file) => {
        if(err) throw err;
        fs.writeFile(file.name, file.data, null, (err) => {
            if(err) throw err;
            console.log(file.name);
        });
    })
});


var pack = new vvv();

// read some music file or something
fs.readFile("somecustommusic.ogg", (err, data) => {
    if(err) throw err;

    // file name could be something else entirely,
    // do that for every file you have, you might need Promise.all
    pack.add("data/music/1pushingonwards.ogg", data, (err) => {
        if(err) throw err;

        // once you're done save the pack
        pack.pack((err, buf) => {
            if(err) throw err;
            fs.writeFile("newfile.vvv", buf, null, (err) => {
                if(err) throw err;
                console.log("writing newfile.vvv");
            });
        })
    });
})
```

If you don't care about code and just want to go ahead and replace the music, there's also a command-line interface, similar to most compressor utilities:

```sh
$ npm install -g vvvvvv
$ vvv -l vvvvvvmusic.vvv # list the files
File: vvvvvvmusic.vvv, size: 61651755
vvv data size: 61644075, number of entries: 16
214810	data/music/0levelcomplete.ogg
4935877	data/music/1pushingonwards.ogg
3711106	data/music/2positiveforce.ogg
6592605	data/music/3potentialforanything.ogg
4066428	data/music/4passionforexploring.ogg
231578	data/music/5intermission.ogg
4067664	data/music/6presentingvvvvvv.ogg
477481	data/music/7gamecomplete.ogg
3839409	data/music/8predestinedfate.ogg
3568983	data/music/9positiveforcereversed.ogg
8785077	data/music/10popularpotpourri.ogg
3254064	data/music/11pipedream.ogg
4823877	data/music/12pressurecooker.ogg
3682137	data/music/13pacedenergy.ogg
5502597	data/music/14piercingthesky.ogg
3890382	data/music/predestinedfatefinallevel.ogg
$ vvv -x vvvvvvmusic.vvv # extract them
$ vvv -c newfile.vvv data/music/* # create a new pack
```

Note that VVVVVV wants at least exactly these filenames (so the last argument should always be `data/music/*`), but there's nothing keeping you from including other files (such as a readme) or reusing the file format for your own thing. Also note that the `-c` option is going to overwrite your file if it exists, will be corrected in a newer version. Once you have your vvv file made, you can dump it in the root of your `data.zip` either as `vvvvvvmusic.vvv` (overwriting the original, so keep a backup) or `mmmmmm.vvv`, the latter (which was made for FamilyJules' soundtrack which you can buy on SoulEye's website) will give you the option to switch between the original soundtrack and your own.

### Levels

*coming soon*

## Links

- Made by [J. P. "juju2143" Savard](https://toasters.rocks)
- Made by studying [Terry Cavanagh's and Ethan Lee's](https://github.com/TerryCavanagh/VVVVVV) slightly terrible source code (say what you want but they tried and the end result is real good ;))
- Licensed under the terms of the Québec Free and Open-Source Licence – Permissive (LiLiQ-P) (for those who care, it's a rather obscure license no one uses but eh, it's OSI-approved)
- Buy [the metal soundtrack](http://magnuspalsson.com/m) (comes with the original `mmmmmm.vvv`)
- Throw some money at me on [Patreon](https://patreon.com/juju2143)
- Have fun!