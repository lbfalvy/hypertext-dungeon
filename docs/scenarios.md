## Move to a child node
Move from a room to a box within.
```yml
room:
    player:
    box:
        ..: => room
```
1. Rooms accept moves to anything inside them
2. The box checks if thing fits

## Move from a location in a room through a neighboring door
```yml
game:
    room1:
        location1:
            player:
            door to room2:
                ..: => location1
                destination: => room2
    room2:
        door to room1:
            ..: => room2
            destination: => location1
```
1. Locations accept moves to anything inside them
2. Door checks if player fits (height?)
3. Door relays to child
4. Room checks if player fits (full?)

### Reverse
```yml
game:
    room1:
        location1:
            door:
                ..: => location1
                destionation: => room2
    room2:
        player:
        door:
            ..: room2
            destionation: => location1
```
1. Rooms -''-
2. Door -''-
3. Door relays to location, location accepts and alerts the enclosing room.