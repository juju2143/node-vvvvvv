/*
struct resourceheader
{
	char name[48];
	int start;
	int size;
	bool valid;
};
*/

const LEN = 60;
const FILES = 128;

module.exports = class VVV {
    constructor(files)
    {
        this._files = files || [];
    }
    static list(buf, callback)
    {
        var files = [];
        var offset = FILES*LEN;
        for(let i = 0; i < FILES; i++)
        {
            var name = buf.toString('ascii', i*LEN, i*LEN+48).replace(/\0*$/g,'');
            var start = buf.readInt32LE(i*LEN+48); // unused
            var size = buf.readInt32LE(i*LEN+52);
            var valid = buf.readInt8(i*LEN+56);
            if(valid == 1)
            {
                files.push({
                    id: i,
                    name: name,
                    start: offset,
                    size: size
                });
            }
            offset += size;
        }
        callback(null, files);
    }
    static unpack(buf, callback)
    {
        this.list(buf, (err, files) => {
            if(err) callback(err);
            else
            {
                files.forEach((file) => {
                    file.data = buf.subarray(file.start, file.start+file.size);
                    callback(null, file);
                })
            }
        });
    }
    add(name, buf, callback)
    {
        if(this._files.length < FILES)
        {
            this._files.push({
                name: name,
                size: buf.length,
                data: buf
            });
            callback(null);
        }
        else
        {
            callback(new Error('reached file limit of '+FILES));
        }
    }
    pack(callback)
    {
        var filesize = FILES*LEN+this._files.reduce((acc, file) => acc + file.size, 0);

        var buf = Buffer.alloc(filesize);

        var offset = FILES*LEN;

        this._files.forEach((file, i) => {
            var name = buf.write(file.name, i*LEN, 48, 'ascii');
            var start = buf.writeInt32LE(offset, i*LEN+48);
            var size = buf.writeInt32LE(file.data.length, i*LEN+52);
            var valid = buf.writeInt8(1, i*LEN+56);
            file.data.copy(buf, offset);

            offset += file.size;
        });
        callback(null, buf);
    }
}