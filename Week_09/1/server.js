// this file serves as a simple server && return response to http requests
const http = require("http")

const returnBody = `<html a=b>
</html>
`

http.createServer((request, response) => {
    let body = [];
    request.
        on('error', (err) => {console.error(err);}).
        on('data', (chunk) => {body.push(chunk);}).
        on('end', () => {
        body = Buffer.concat(body).toString()
        // log reqeust body
        console.log("request header: ", request.headers)
        console.log("request body:", body)

        response.writeHead(200, {'Content-Type': 'text/html'})
        response.end(returnBody)
    });
}).listen(8088);

console.log("server has started")
