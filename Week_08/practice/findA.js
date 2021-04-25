

function findA(s) {
    for(let char of s) {
        if (char === "a") {
            return true
        }
    }
    return false
}


console.log(findA("qbc"))