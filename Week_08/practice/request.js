
const net = require('net');


class Request {
    constructor(options){
        this.method = options.method || "GET"
        this.host = options.host
        this.port = options.port || 80
        this.path = options.path || "/"
        this.body = options.body || {}
        this.headers = options.headers || {}
        if(!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        if(this.headers["Content-Type"] === "application/json")
            this.bodyText = JSON.stringify(this.body)
        else if(this.headers["Content-Type"] === "application/x-www-form-urlencoded")
            // get object attributes . keys
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');
        
        this.headers["Content-Length"] = this.bodyText.length;
    }

    send(conn) {
        // why do we need Promise here?
        return new Promise((resolve, reject) => {
            const parser = new ResponseParser;
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

            conn.on('data', (data) => {
                console.log(data.toString());
                // we need to parse response 
                parser.receive(data.toString());
                if(parser.isFinished) {
                    resolve(parser.response());
                    conn.end();
                }
            })

            conn.on('error', (err) => {
                reject(err);
                conn.end();
            })

        })
    }

    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`
    }
}


// example
// HTTP/1.1 200 OK
// Content-Type: text/html
// Date: Wed, 28 Apr 2021 04:14:10 GMT
// Connection: keep-alive
// Keep-Alive: timeout=5
// Transfer-Encoding: chunked

// d
//  Hello World

// 0

class ResponseParser {
    constructor() {
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7;

        this.current = this.WAITING_STATUS_LINE;
        this.status_line = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyParser = null;
    }
    receive(string) {
        for(let i=0; i<string.length; i++) {
            this.receiveChar(string.charAt(i))
        }
    }

    isFinished() {
        return this.bodyParser.isFinished && this.bodyParser
    }

    response() {
        this.status_line.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join("")
        }
    }
    receiveChar(char){
        if(this.current === this.WAITING_STATUS_LINE) {
            if(char === '\r') {
                this.current = this.WAITING_STATUS_LINE_END
            } else {
                this.status_line += char;
            }
        } else if (this.current === this.WAITING_STATUS_LINE_END){
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_NAME) {
            if (char === ':') {
                this.current = this.WAITING_HEADER_SPACE;
            } else if (char === '\r') {
                // search for new headers but found \r\n 
                this.current = this.WAITING_HEADER_BLOCK_END
                if (this.headers['Transfer-Encoding'] === 'chunked') {
                    this.bodyParser = new TrunkedBodyParser();
                }
            } else {
                this.headerName += char
                } 
        } else if (this.current === this.WAITING_HEADER_SPACE) {
            if (char === " ") {
                this.current = this.WAITING_HEADER_VALUE
            }
        } else if (this.current === this.WAITING_HEADER_VALUE) {
            if (char === "\r") {
                this.current = this.WAITING_HEADER_LINE_END;
                this.headers[this.headerName] = this.headerValue;
                this.headerName = ""
                this.headerValue = ""
            } else {
                this.headerValue += char;
            }
        } else if (this.current === this.WAITING_HEADER_LINE_END) {
            if (char === "\n") {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_BLOCK_END) {
            if (char === "\n") {
                this.current = this.WAITING_BODY;
            }
        } else if(this.current === this.WAITING_BODY) {
            this.bodyParser.receiveChar(char);
        }
    }
}


class TrunkedBodyParser {
    constructor() {
        this.WAITING_LENGTH = 0;
        this.WAITING_LENGTH_LINE_HEAD = 1;
        this.READING_TRUNK = 2;
        this.WAITING_NEW_LINE = 3;
        this.WAITING_NEW_LINE_END = 4;
        this.length = 0;
        this.content = [];
        this.isFinished = false;
        this.current = this.WAITING_LENGTH;
    }

    receiveChar(c) {
        if(this.current === this.WAITING_LENGTH) {
            if(c === '\r') {
                if (this.length === 0) {
                    this.isFinished = true;
                    return
                }
                this.current = this.WAITING_LENGTH_LINE_HEAD;
            } else {
                this.length *= 16;
                this.length += parseInt(c, 16);
            }
        } else if(this.current === this.WAITING_LENGTH_LINE_HEAD) {
            if(c === "\n") {
                this.current = this.READING_TRUNK;
            }
        } else if(this.current === this.READING_TRUNK) {
            this.content.push(c);
            this.length--;
            if(this.length === 0) {
                this.current =this.WAITING_NEW_LINE;
            }
        } else if(this.current === this.WAITING_NEW_LINE) {
            if(c === "\r") {
                this.current = this.WAITING_LENGTH_LINE_END;
            }
        } else if(this.current === this.WAITING_NEW_LINE_END) {
            if(c === "\n") {
                this.current = this.WAITING_LENGTH;
            }
        }
    }

}

void async function(){
    let request = new Request({
        method: "POST",
        host: "127.0.0.1",
        port: "8088",
        path: "/",
        headers: {
            ["X"]: "customed"
        },
        body: {
            name: "Yiang"
        }
    });
    console.log(request.toString())
    let response = await request.send();

    console.log(response)
}()