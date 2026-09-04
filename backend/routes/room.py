from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List


router = APIRouter()


# ============================================================
# ROOM MANAGER
# ============================================================

class ConnectionManager:

    def __init__(self):
        # {
        #     "room_id": [websocket1, websocket2, ...]
        # }
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()

        if room_id not in self.rooms:
            self.rooms[room_id] = []

        self.rooms[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):

        if room_id in self.rooms:

            if websocket in self.rooms[room_id]:
                self.rooms[room_id].remove(websocket)

            # Delete empty rooms
            if len(self.rooms[room_id]) == 0:
                del self.rooms[room_id]

    async def broadcast(
        self,
        room_id: str,
        message: dict,
        exclude: WebSocket | None = None
    ):

        if room_id not in self.rooms:
            return

        disconnected = []

        for connection in self.rooms[room_id]:

            if connection == exclude:
                continue

            try:
                await connection.send_json(message)

            except Exception:
                disconnected.append(connection)

        # Remove broken connections
        for connection in disconnected:
            self.disconnect(room_id, connection)

    def get_user_count(self, room_id: str) -> int:

        if room_id not in self.rooms:
            return 0

        return len(self.rooms[room_id])


manager = ConnectionManager()


# ============================================================
# WEBSOCKET ROOM
# ============================================================

@router.websocket("/ws/{room_id}")
async def websocket_room(
    websocket: WebSocket,
    room_id: str
):

    await manager.connect(room_id, websocket)

    user_count = manager.get_user_count(room_id)

    print(
        f"[WebSocket] User connected to room "
        f"{room_id} | Users: {user_count}"
    )

    # Tell existing users that someone joined
    await manager.broadcast(
        room_id,
        {
            "type": "user_joined",
            "room_id": room_id,
            "user_count": user_count
        }
    )

    try:

        while True:

            # Wait for messages from this user
            data = await websocket.receive_json()

            print(
                f"[WebSocket] Room {room_id}: "
                f"{data}"
            )

            # Broadcast message to everyone else
            await manager.broadcast(
                room_id,
                data,
                exclude=websocket
            )

    except WebSocketDisconnect:

        manager.disconnect(
            room_id,
            websocket
        )

        user_count = manager.get_user_count(room_id)

        print(
            f"[WebSocket] User disconnected from room "
            f"{room_id} | Users: {user_count}"
        )

        # Tell remaining users
        await manager.broadcast(
            room_id,
            {
                "type": "user_left",
                "room_id": room_id,
                "user_count": user_count
            }
        )

    except Exception as e:

        print(
            f"[WebSocket ERROR] Room {room_id}: {e}"
        )

        manager.disconnect(
            room_id,
            websocket
        )