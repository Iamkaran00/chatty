class RaceManager {

    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomId, player1Id) {

        const room = {
            id: roomId,
            players: {
                [player1Id]: {
                    id: player1Id,
                    progress: 0,
                    readyForRematch: false
                }
            },
            sentence: "",
            status: "waiting",
            startTime: null
        };

        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    async joinRoom(roomId, player2Id) {

        const room = this.rooms.get(roomId);

        if (!room) return { error: "Room Not Found" };

        if (Object.keys(room.players).length >= 2)
            return { error: "Room is Full" };

        room.players[player2Id] = {
            id: player2Id,
            progress: 0,
            readyForRematch: false
        };

        return room;
    }

    setSentence(roomId, sentence) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.sentence = sentence;
        room.status = "countdown";
    }

    updateProgress(roomId, playerId, payload) {

        const room = this.rooms.get(roomId);

        if (!room || room.status !== "playing") return null;

        const player = room.players[playerId];
        if (!player) return null;

        const newProgress = payload.progress;

        if (newProgress < player.progress) return null;
        if (newProgress > 1) return null;

        // anti cheat
        if (newProgress - player.progress > 0.35) return null;

        player.progress = newProgress;

        if (player.progress >= 1 && room.status === "playing") {

            room.status = "finished";

            return {
                finished: true,
                winnerId: playerId,
                players: Object.keys(room.players)
            };
        }

        return { finished: false };
    }

    handleRematch(roomId, playerId) {

        const room = this.rooms.get(roomId);
        if (!room) return false;

        room.players[playerId].readyForRematch = true;

        const allReady = Object.values(room.players).every(
            (p) => p.readyForRematch
        );

        if (allReady) {

            Object.values(room.players).forEach((p) => {
                p.progress = 0;
                p.readyForRematch = false;
            });

            room.status = "countdown";

            return true;
        }

        return false;
    }

    removePlayer(roomId, playerId) {

        const room = this.rooms.get(roomId);

        if (!room) return;

        delete room.players[playerId];

        if (Object.keys(room.players).length === 0) {
            this.rooms.delete(roomId);
        }
    }
}

export default new RaceManager();