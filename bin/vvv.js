#!/usr/bin/env node
const { vvv } = require('..');
const fs = require('fs');
const path = require('path');
const getopt = require('posix-getopt');
const package = require('../package.json');

function log(current, target, ...message)
{
    if(current >= target)
        console.log(...message);
}

function unpack(filename, options)
{
    options = options || {};
    fs.readFile(filename, (err, data) => {
        if(err) console.error(err.message);
        else
        {
            vvv.unpack(data, (err, file) => {
                if(err) console.error(err.message);
                else
                {
                    var dir = path.dirname(file.name);
                    fs.access(file.name, (err) => {
                        if(err || options.force)
                        {
                            fs.access(dir, (err) => {
                                if(err){
                                    fs.mkdirSync(dir, {recursive: true});
                                    log(options.verbose, 2, "%s", dir);
                                }

                                fs.writeFile(file.name, file.data, null, (err) => {
                                    if(err) console.error(err.message);
                                    else
                                    {
                                        log(options.verbose, 1, "%s", file.name);
                                    }
                                });
                            })
                        }
                        else
                        {
                            console.error("error: %s exists, pass -f to force", file.name);
                        }
                    });
                }
            })
        }
    });
}

function list(filename, options)
{
    options = options || {};
    fs.readFile(filename, (err, data) => {
        if(err) console.error(err.message);
        else
        {
            console.log("File: %s, size: %d", filename, data.length);
            vvv.list(data, (err, files) => {
                if(err) console.error(err.message);
                else
                {
                    var size = files.reduce((acc, file) => acc + file.size, 0);
                    log(options.verbose, 1, "vvv data size: %d, number of entries: %d", size, files.length)
                    files.forEach(file => {
                        log(options.verbose, 1, "%d\t%s", file.size, file.name);
                    });
                }
            })
        }
    });
}

function pack(filename, files, options)
{
    options = options || {};
    packing = new vvv();
    var promises = files.map((file) => {
        return new Promise((resolve, reject) => {
            fs.readFile(file, (err, data) => {
                if(err) console.error(err.message);
                else
                {
                    packing.add(file, data, (err) => {
                        if(err) console.error(err.message);
                        else {
                            log(options.verbose, 1, "%s", file);
                            resolve();
                        }
                    });
                }
            })
        })
    })
    Promise.all(promises).then(() => {
        packing.pack((err, buf) => {
            if(err) console.error(err.message);
            else
            {
                fs.writeFile(filename, buf, null, (err) => {
                    if(err) console.error(err.message);
                    else
                    {
                        log(options.verbose, 1, "writing %s", filename);
                    }
                });
            }
        })
    });
}

function usage(msg)
{
    console.error(msg);
    console.error("VVV file archiver v%s by %s", package.version, package.author);
    console.error(package.homepage);
    console.error("usage: %s [commands] [options] archive list", path.basename(process.argv[1]));
    console.error("Commands:");
    console.error("\t-x\tExtracts files");
    console.error("\t-l\tList files");
    console.error("\t-c\tCreate archive");
    console.error("Options:");
    console.error("\t-f\tWrite files even if they exist");
    console.error("\t-v\tIncrease verbosity");
    console.error("\t-q\tDecrease verbosity");
    console.error("\tarchive\tName of archive to deal with");
    console.error("\tlist\tIn create mode, list of files to pack");
}

parser = new getopt.BasicParser(':xlcvf', process.argv);

var mode = '';
var options = {
    force: false,
    verbose: 1
}
var inputs = 0;

while ((option = parser.getopt()) !== undefined) {
	switch(option.option) {
	case 'l':
        mode = 'list';
        break;
        
    case 'x':
        mode = 'unpack';
        break;

    case 'c':
        mode = 'pack';
        inputs = 1;
        break;

	case 'f':
		options.force = true;
		break;

    case 'v':
        options.verbose++;
        break;

    case 'q':
        options.verbose--;
        break;

	default:
		/* error message already emitted by getopt */
		break;
	}
}

if (parser.optind() >= process.argv.length-inputs)
    usage('error: missing required files');
else
{
    var optind = parser.optind();
    var input =  process.argv[optind++];
    var files = [];
    while(optind < process.argv.length)
    {
        files.push(process.argv[optind++]);
    }
    switch(mode) {
        case 'unpack':
            unpack(input, options);
            break;
        case 'list':
            list(input, options);
            break;
        case 'pack':
            pack(input, files, options);
            break;
        default:
            usage("error: no command given");
    }
}