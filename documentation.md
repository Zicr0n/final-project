# General Room Logic
## Room List 
- When the player clicks on a room, they join it.

## Pre-game
- When the player is in a room, they need to press the join button to participate in the current game, if the game is not active (UNLESS ROOM TYPE ALLOWS MIDGAME JOINS)
- If less than 2 players joined, room will not start.
- If room owner is editing rules, room will not start

## Mid-game
- If the player count becomes 1, then end the game and set winner
- Otherwise, play the game as usual and end it upon specific condition (win condition)

# Word-bomb Room Logic
## Pre-game
- Game owner can decide the time to write and amount of lives

## Mid-game
- Players play turns writing a word that includes a specific letter combination
- Word must be an english word, (API?)
- If word written before time runs out, turn changes
- If not, player loses a life.
- If a player runs out of lives, they lose and spectate (player.joined = false)
- If only one player stands, set as winner and end game (win condition)