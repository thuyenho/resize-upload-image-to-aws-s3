var http = require('http');
var url = require('url');
var util = require('util');
var querystring = require('querystring');
var multiparty = require('multiparty');
var fs = require('fs');

var utils = require('./utils.js')
const PORT=8080; 

//We need a function which handles requests and send response
function handleRequest(req, res){
    var headers = req.headers;
    var method = req.method;
    var reqUrl = req.url; 
    var query = url.parse(reqUrl).query;
    var params = querystring.parse(query);
    var body = [];

    if (req.url === '/upload' && req.method === 'POST') {
        var form = new multiparty.Form();

        form.parse(req, function(err, fields, files) {
            var author = fields.author[0];
            var source = fields.source[0];
            var photo =  files.photo;

            if (!(author && source && photo)) {
                res.writeHead(400);
                res.end('All fields are required');
            } else {

                utils.resizeImages(files.photo)
                .then((result) => {
                    return utils.addFilePathForAWSS3(source, author, result);
                })
                .then((result) => {
                    return utils.uploadImages(result);
                })
                .then((result) => {
                    res.writeHead(200, {'content-type': 'application/json'});
                    res.end(JSON.stringify(result));
                })
                .catch((err) => {
                    res.writeHead(400);
                    res.end(err);
                });   
           }

        });
    } else {
        // show a file upload form 
        res.writeHead(200, {'content-type': 'text/html'});
        res.end(fs.readFileSync('./upload.html'));
    }   
}

//Create a server
var server = http.createServer(handleRequest);
//Lets start our server
server.listen(PORT, function(){
    console.log("Server listening on: http://localhost:%s", PORT);
});
