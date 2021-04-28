const http = require("http")


// server is not a part of browser, so we assume there is a place in the world 
// that has a web server responding http requests
http.createServer((request, response) => {
    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString()
        console.log(body)
        response.writeHead(200, {'Content-Type': 'text/html'})
        response.end(' Hello World\n')
    });
}).listen(8088);

console.log("server started")