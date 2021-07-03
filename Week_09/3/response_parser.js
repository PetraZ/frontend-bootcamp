

// object: parse http response

// HTTP/1.1 200 OK
// Content-Type: text/html
// Date: Thu, 24 Jun 2021 23:51:23 GMT
// Connection: keep-alive
// Keep-Alive: timeout=5
// Transfer-Encoding: chunked

// c7

// <html a=b>
// <head d=c a='dd'>
// </head>
// <style>
//     body div.introText {
//         background: red;
//         color: blue;
//     }
// </style>
// <body>
//     <div class='introText'>hello world</div>
// </body>
// </html>
// 0


class HTTPResponseParser {
    constructor() {

        this.status_f = this._waitStatusLine
        this.status_line = ""
        this.request_status = {}

        this.current_header_name = ""
        this.current_header_value = ""
        this.headers = {}


        // abstract this away cause it can be one of the various type
        this.body_parser = null
    }

    isDone() {
        return this.body_parser && this.body_parser.isDone()
    }

    response() {
        return {
            statusCode: this.request_status.status_code,
            statusText: this.request_status.status,
            headers: this.headers,
            body: this.body_parser.content
        }
    }

    handleString(string) {
        for(let i=0; i<string.length; i++) {
            this.handleChar(string.charAt(i))
        }
    }

    handleChar = (c) => {
        this.status_f = this.status_f(c)
        return this.status_f
    }

    // wait for \r
    _waitStatusLine = (c) => {
        if(c === "\r") {
            return this._waitStatusLineEnd
        }
        this.status_line += c
        return this._waitStatusLine
    }

    // wait for \n
    _waitStatusLineEnd = (c) => {
        if(c === "\n") {
            let [http_protocol, status_code, status] = this.status_line.split(" ")
            this.request_status = {
                http_protocol: http_protocol,
                status_code: status_code,
                status: status,
            }
            this.status_line = ""
            return this._waitHeaderLineName
        }
        throw new Error(`waiting status line, after \r is not \n`)
    }


    // wait for \r
    _waitHeaderLineName = (c) => {
        if(c === ":") {
            return this._waitHeadeLineValue
        }
        // hit the end of headers
        if(c === "\r") {
            return this._waitHeadersEnd
        }

        this.current_header_name += c
        return this._waitHeaderLineName
    }

    _waitHeadeLineValue = (c) => {
        if(c === "\r") {
            return this._waitHeaderLineEnd
        }
        if(c === " ") {
            return this._waitHeadeLineValue
        }
        this.current_header_value += c
        return this._waitHeadeLineValue
    }

    _waitHeaderLineEnd = (c) => {
        if(c === "\n") {
            this.headers[this.current_header_name] = this.current_header_value
            this.current_header_name = ""
            this.current_header_value = ""
            return this._waitHeaderLineName
        }
        throw Error(`waiting header line end: after \r is not \n`)
    }

    _waitHeadersEnd = (c) => {
        if(c === "\n") {
            if (this.headers["Transfer-Encoding"] === "chunked") {
                this.body_parser = new ChunkedBodyParser();
            } else {
                throw new Error(`do not support transfer encoding ${this.headers["Transfer-Encoding"]}`)
            }
            return this._waitBody
        }
        throw Error(`waiting headers end: after \r is not \n`)
    }

    _waitBody = (c) => {
        return this.body_parser.handleChar(c);
    }

}


class ChunkedBodyParser {
    constructor() {
        this.status_f = this._waitLength
        this.current_chunk_length = 0
        this.content = ""
        this.is_done = false
    }

    // use array function to avoid weirdness in this in normal function
    handleChar = (c) => {
        this.status_f = this.status_f(c)
        return this.status_f
    }

    isDone = (c) => {
        return this.is_done
    }

    _finished = (c) => {
        return this._finished
    }

    _waitLength = (c) => {
        if (c === "\r") {
            return this._waitLengthEnd
        }
        this.current_chunk_length = this.current_chunk_length * 16 + parseInt(c, 16)
        return this._waitLength
    }

    _waitLengthEnd = (c) => {
        if (c === "\n") {
            if (this.current_chunk_length === 0) {
                this.is_done = true
                return this._finished
            }
            return this._waitChunkBodyLineEnd
        }
        throw Error(`ChunkedBodyParser waitLengthEnd: after \r is not \n`)
    }

    // body line does not have \r\n only \n often
    _waitChunkBodyLineEnd = (c) => {
        this.content += c
        this.current_chunk_length -= 1
        if(this.current_chunk_length === 0) {
            return this._waitSepLine
        }
        return this._waitChunkBodyLineEnd
    }

    _waitSepLine = (c) => {
        if(c === "\r") {
            return this._waitSepLineEnd
        }
     }

     _waitSepLineEnd = (c) => {
         if(c === "\n") {
            return this._waitLength
         }
         throw new Error(`_waitSepLineEnd after \r is not \n`)
     }
}


function testBodyParser() {
    let bodyParse = new ChunkedBodyParser()
    let bodyText = `13\r
<html a=b>
</html>
\r
0\r
\r
`
    for(let c of bodyText) {
        bodyParse.handleChar(c)
    }
    console.log(bodyParse.content)
    console.log(bodyParse.current_chunk_length)
    console.log(bodyParse.isDone())
}




// testBodyParser()


function testHtmlParser() {
    let parser = new HTTPResponseParser()
    let htmlText = `HTTP/1.1 200 OK\r
Content-Type: text/html\r
Date: Fri, 25 Jun 2021 04:10:01 GMT\r
Connection: keep-alive\r
Keep-Alive: timeout=5\r
Transfer-Encoding: chunked\r
\r
13\r
<html a=b>
</html>
\r
0\r
\r
`

    // for(let c of htmlText) {
    //     parser.handleChar(c)
    // }
    parser.handleString(htmlText)

    console.log(parser.headers)
    console.log(parser.request_status)
    console.log(parser.body_parser.content)

    console.log(parser.isDone())
}


testHtmlParser()



module.exports =  {
    HTTPResponseParser
};
