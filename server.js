const express = require('express');
const app = new express();
let path = require("path");

app.use("/css", express.static(__dirname + '/public/css'));
app.use("/images", express.static(__dirname + '/public/images'));
app.use("/js", express.static(__dirname + '/public/js'));
app.use("/serviceWorker.js", express.static(__dirname + '/public/serviceWorker.js'));
app.use("/manifest.json", express.static(__dirname + '/public/manifest.json'));

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.listen(3000);

console.log("Running at Port 3000");