const net = require('net');
const {HTTPResponseParser} = require("./response_parser.js")


class Request{
    constructor(params) {
        this.host = params.host
        this.port = params.port

        // method and path createa unique identifier for this server
        this.method = params.method || "GET"
        this.path = params.path || "/"

        this.headers = params.headers || {}
        this.body = params.body || {}

        if(!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }

        // only support two body content type here either json or urlencoded
        if(this.headers["Content-Type"] === "application/json")
            //obj -> str
            this.bodyText = JSON.stringify(this.body)

        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST just a encoding schema
        else if (this.headers["Content-Type"] === "application/x-www-form-urlencoded") {
            this.bodyText = Object.keys(this.body).map(key => {return `${key}=${encodeURIComponent(this.body[key])}`}).join("&")
        }
        this.headers["Content-Length"] = this.bodyText.length;
    }

    send(conn) {
        return new Promise((resolve, reject) => {
            // console.log("Coming request starts ------")
            // console.log(this.toString())
            // console.log("Coming request ends ------")
            if(conn){
                conn.write(this.toString());
            }else{
                conn = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    conn.write(this.toString());
                })
            }
            const parser = new HTTPResponseParser();
            conn.on("data", (data) => {
                parser.handleString(data.toString())
                if(parser.isDone) {
                    let res = parser.response()
                    console.log("status: ", res.statusCode)
                    console.log("headers: ", res.headers)
                    console.log("body: ", res.body)

                    resolve("")
                    conn.end();
                }
            })
            conn.on("error", (err) =>
            {
                console.log(err);
                reject("error")
            })
        })
    }

    // example

    // POST / HTTP/1.1
    // header0: 0
    // Content-Type: application/x-www-form-urlencoded
    // Content-Length: 7

    // body0=0

    // convert current Request obj to ready to send requst string
    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`
    }
}




void async function() {
    let request = new Request({
        host: "localhost",
        port: "8088",
        method: "POST",
        path: "",
        headers: {"header0": 0},
        body: {"body0":0}
    })

    let response = await request.send();

}()

//response is like

/*
HTTP/1.1 200 OK
Content-Type: text/html
Date: Thu, 24 Jun 2021 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

c7

<html a=b>
<head d=c a='dd'>
</head>
<style>
    body div.introText {
        background: red;
        color: blue;
    }
</style>
<body>
    <div class='introText'>hello world</div>
</body>
</html>
0
*/
