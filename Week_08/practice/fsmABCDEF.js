

// basic idea 
// use function to represent a state and its transformation give input to another state(func)


function start(c) {
    if(c == "a") {
        return stateA
    }else{
        return start
    }
}

function stateA(c) {
    if(c == "b") {
        return stateB
    }else {
        return start(c)
    }
}

function stateB(c) {
    if(c == "c") {
        return stateC
    }else {
        return start(c)
    }
}

function stateC(c) {
    if(c == "d") {
        return stateD
    }else {
        return start(c)
    }
}

function stateD(c) {
    if(c == "e") {
        return stateE
    }else {
        return start(c)
    }
}

function stateE(c) {
    if(c == "f") {
        return end
    }else {
        return start(c)
    }
}

function end() {
    return end
}

function findABCDEF(s) {
    state = start
    for(let c of s) {
        state = state(c)
    }
    // interesting javascript allows function comparison :)
    return state === end
}

console.log(findABCDEF("abcdefasdf"))