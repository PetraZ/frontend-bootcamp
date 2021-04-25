

function findAB(s) {
    foundA = false
    for(let char of s) {
        if (char === "a") {
            foundA = true
            continue
        }
        foundA = false
        if (char === "b" && foundA === true) {
            return true
        }
    }
    return false
}



console.log(findAB("asdfjaslbja"))