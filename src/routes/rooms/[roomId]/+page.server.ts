import { redirect } from '@sveltejs/kit'

export function load({params}){
    const roomId = params.roomId
    const validRooms = ["lobby", "dungeon", "miku"]

    if(!validRooms.includes(roomId)){
        throw redirect(302, "/rooms")
    }

    return { roomId : params.roomId}
}