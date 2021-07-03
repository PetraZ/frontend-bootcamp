const css = require("css");
const EOF = Symbol("EOF");

let currentToken = null;
let currentAttribute = null;

let letterReg = /^[a-zA-Z]$/
let spaceReg = /^[\t\n\f ]$/


let stack = [{type: "document", children:[]}];
let currentTextNode = null;

// for css rules
let rules = [];
function addCSSRules(text) {
    var ast = css.parse(text);
    console.log(JSON.stringify(ast, null, "   "))
    rules.push(...ast.stylesheet.rules);
}


function computeCSS(element) {
    console.log(rules)
    console.log("compute css for element", element)
}

function emit(token) {
    // console.log(token)

    let top = stack[stack.length - 1];

    if(token.type === "startTag") {
        let element = {
            type: "element",
            children: [],
            attributes: []
        };

        element.tagName = token.tagName;

        // add all attributes in
        for(let p in token) {
            if(p != "type" && p != "tagName") {
                element.attributes.push({
                    name: p,
                    value: token[p]
                });
            }
        }

        top.children.push(element);
        element.parent = top;

        // if not start Tag is not self closing, then we need to push this onto stack
        if(!token.isSelfClosing) {
            stack.push(element)
        }
        currentTextNode = null;

    } else if(token.type === "endTag") {
       if(top.tagName !== token.tagName) {
           throw new Error("Tag start and end do not match");
       } else {
            if(top.tagName === "style") {
                addCSSRules(top.children[0].content);
            }
            stack.pop();
       }
       currentTextNode = null;
    } else if(token.type === "text") {
        if (currentTextNode === null) {
            currentTextNode = {
                type: "text",
                content: ""
            };
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
}

// data is generic state of taking input char
function data(c) {
    // 3 options
    // 1. is a tag
    // 2. EOF
    // 3. text node like <a> abcd(text here) </a>

    if(c == "<"){
        // tag opens <
        return tagOpen;
    } else if (c == EOF) {
        emit({
            type: 'EOF'
        });
        return ;
    } else {
        emit({
            type: 'text',
            content: c
        });
        return data
    }
}

// tag Open is the state that has seen(last char) is <
function tagOpen(c) {
    // </ is endTag's Opening
    if(c == "/") {
        return endTagOpen;
    } else if(c.match(letterReg)) {
        currentToken = {
            type: "startTag",
            tagName: ""
        }
        return tagName(c);
    } else {
        return;
    }
}


function endTagOpen(c) {
    if(c.match(letterReg)) {
        currentToken = {
            type: "endTag",
            tagName: ""
        };
        return tagName(c);
    } else if(c == ">") {
        console.log("end tag missing name")
    } else if(c == EOF) {
        console.log("end tag open hits EOF")
    } else {
        console.log("end tag never closes")
    }
}

function tagName(c) {
    // tagName ends with one of the following char
    if(c.match(spaceReg)) {
        return beforeAttributeName
    } else if(c == "/") {
        return selfClosingStartTag;
    } else if(c.match(letterReg)) {
        currentToken.tagName += c
        return tagName
    } else if(c == ">") {
        // current tag token closes
        emit(currentToken)
        return data
    } else {
        return tagName
    }
}

function beforeAttributeName(c) {
    if(c.match(spaceReg)) {
        return beforeAttributeName
    } else if(c == "/" || c == ">" || c == EOF) {
        return afterAttributeName(c);
    } else if(c == "=") {
        console.log("beforeAttributeName shounld not have = sign")
    } else {
        currentAttribute = {
            name: "",
            value: ""
        }
        return attributeName(c)
    }
    return beforeAttributeName;
}

function afterAttributeName(c) {
    if (c.match(spaceReg)) {
        return afterAttributeName
    } else if (c === "/") {
        // hit like <img src=a />
        return selfClosingStartTag
    } else if (c === "=") {
        return beforeAttributeName;
    } else if (c === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    }
}

function attributeName(c) {
    if(c.match(spaceReg) || c === "/" || c === ">" || c === EOF) {
        return afterAttributeName;
    } else if (c === "=") {
        return beforeAttributeValue;
    } else if (c === '\u0000') {

    } else if (c === '\"' || c === '\'' || c === '<') {

    } else {
        currentAttribute.name += c;
        return attributeName;
    }
}


function beforeAttributeValue(c) {
    if (c.match(spaceReg) || c === '/' || c === '>' || c === EOF) {
        return beforeAttributeValue;
    } else if (c === '\"') {
        return doubleQuotedAttributeValue;
    } else if (c === '\'') {
        return singleQuotedAttributeValue;
    } else if (c === '>') {

    } else {
        return unquotedAttributeValue(c);
    }
}

function doubleQuotedAttributeValue(c) {
    if (c === '\"') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterAttributeName;
    } else if (c === '\u0000') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function singleQuotedAttributeValue(c) {
    if (c === '\'') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterAttributeName;
    } else if (c === '\u0000') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return singleQuotedAttributeValue;
    }
}

function unquotedAttributeValue(c) {
    if (c.match(spaceReg)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c === '/') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === '\u0000') {

    } else if (c === '\"' || c === "'" || c === '<' || c === '=' || c === '`') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return unquotedAttributeValue;
    }
}


function selfClosingStartTag(c) {
    if(c == ">") {
        currentToken.isSelfClosing = true;
        emit(currentToken)
        return data
    } else if(c === EOF) {
        console.log("hitting EOF in selfClosingStartTag")
    } else {
        console.log("hitting EOF in selfClosingStartTag")
    }
}

module.exports.parseHTML = function parseHTML(html) {
    let state = data;
    for(let c of html) {
        state = state(c);
    }
    state = state(EOF)
    console.log(stack[0])
}

// html tags

// start tag <xxx>
// end tag </xxx>
// self closing tag <xxx />
