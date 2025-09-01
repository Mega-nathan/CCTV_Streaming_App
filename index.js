const express=require('express');
const app=express();
const fs=require('fs');

app.get('/',(req,res)=>{
    res.sendFile( __dirname + "/index.html" );
})

app.get('/video',(req,res)=>{
    const range=req.headers.range;

    if(!range) res.status(400).send('error');

    const videopath='guess_my_number_project.mp4';
    const videosize=fs.statSync(videopath).size;

    const chunksize = 10 ** 6;

    const start=Number(range.replace(/\D/g,''));
    const end=Math.min(start+chunksize , videosize-1);

    const contentLength=end-start+1;
    const headers={
        "Content-Range" : `bytes ${start}-${end}/${videosize}`,
        "Accept-Range" : 'bytes',
        "Content-Length" : contentLength,
        "Content-Type" : "video/mp4"
    }

    res.writeHead(206,headers);

    const videoStream=fs.createReadStream(videopath,{start,end});
    videoStream.pipe(res);
})

app.get('/fullvideo', (req, res) => {
    const videopath = 'guess_my_number_project.mp4';

    // Get file size
    const fileSize = fs.statSync(videopath).size;

    // Set headers for full file
    res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
    });

    // Stream the whole file at once
    const readStream = fs.createReadStream(videopath);
    readStream.pipe(res);
});

app.listen(3000,()=>{
    console.log('App is listening at localhost:3000');
});