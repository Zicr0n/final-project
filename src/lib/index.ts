// place files you want to import through the `$lib` alias in this folder.
export let Players = {}

export function AssignCharacter(userId){
    return {
        userId,
        x : 0,
        y : 100
    }
}