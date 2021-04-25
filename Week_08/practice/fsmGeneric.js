

function match(s, pattern) {
    if(s.length === 0) {
        return 
    }
    let table = buildNextTableComplex(pattern)
    // all states(last char is end state so only +1 here) plus start and end
    let states = new Array(pattern.length + 1)
    
    states[0] = c => c === pattern[0]? states[1] : states[0]
    states[states.length - 1] = () => states[states.length - 1]

    for(let i=1; i<states.length-1; i++) {
        states[i] = c => c === pattern[i]? states[i+1]:states[table[i-1]](c)
    }

    state = states[0]
    for(let j=0; j<s.length; j++) {
        state = state(s[j])
    }
    return state === states[states.length - 1]
}


// week04 implementation
function buildNextTableComplex(pattern) {
    let table = new Array(pattern.length).fill(0)
    for(let i = 1; i<pattern.length; i++) {
        if(pattern[i] === pattern[table[i-1]]) {
            table[i] = table[i-1] + 1
            continue
        }
        // if not equal 
        let idx = table[i-1]
        while(idx != 0) {
            if(pattern[i] === pattern[idx]) {
                table[i] = table[idx-1] + 1
                break
            }
            idx = table[idx - 1]
        }

        if(idx === 0) {
            if(pattern[i] === pattern[idx]) {
                table[i] = 1
            }
        }
    }
    return table
}

console.log(match("qwababerqwerqabababx", "abababx"))