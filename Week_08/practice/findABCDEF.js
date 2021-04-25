

function findABCDEF(s) {
    found = new Array(6).fill(false);
    for(let char of s) {
        if (char === "a") {
            found[0] = true
            continue
        }
        else if (char === "b" && found[0]) {
            found[1] = true
        }
        else if (char === "c" && found[1]) {
            found[2] = true
        }
        else if (char === "d" && found[2]) {
            found[3] = true
        }
        else if (char === "e" && found[3]) {
            found[4] = true
        }
        else if (char === "f" && found[4]) {
            return true
        }
        else {
            found.fill(false)
        }
    }
    return false
}

console.log(findABCDEF("abcdeasdf"))