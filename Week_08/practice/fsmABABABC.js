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
    if(c == "a") {
        return stateA2
    }else {
        return start(c)
    }
}

function stateA2(c) {
    if(c == "b") {
        return stateB2
    }else {
        return start(c)
    }
}

function stateB2(c) {
    if(c == "a") {
        return stateA3
    }else {
        return start(c)
    }
}

function stateA3(c) {
    if(c == "b") {
        return stateB3
    }else {
        return start(c)
    }
}

function stateB3(c) {
    if(c == "c") {
        return end
    }else {
        return stateB2(c)
    }
}

function end() {
    return end
}

function findABABABC(s) {
    state = start
    for(let c of s) {
        state = state(c)
    }
    return state === end
}

console.log(findABABABC("abababxasd"))