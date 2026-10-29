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
        self.user_names: Dict[str, Dict[int, str]] = {}

    async def connect(self, room_id: str, websocket: WebSocket, user_name: str):
        await websocket.accept()

        if room_id not in self.rooms:
            self.rooms[room_id] = []

        self.rooms[room_id].append(websocket)
        self.user_names.setdefault(room_id, {})[id(websocket)] = user_name

    def disconnect(self, room_id: str, websocket: WebSocket):

        if room_id in self.rooms:

            if websocket in self.rooms[room_id]:
                self.rooms[room_id].remove(websocket)

            self.user_names.get(room_id, {}).pop(id(websocket), None)

            # Delete empty rooms
            if len(self.rooms[room_id]) == 0:
                del self.rooms[room_id]
                self.user_names.pop(room_id, None)

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

    def get_user_names(self, room_id: str) -> List[str]:
        return list(self.user_names.get(room_id, {}).values())


manager = ConnectionManager()


# ============================================================
# WEBSOCKET ROOM
# ============================================================

@router.websocket("/ws/{room_id}")
async def websocket_room(
    websocket: WebSocket,
    room_id: str,
    user: str = "Guest",
):

    user_name = user.strip()[:48] or "Guest"
    await manager.connect(room_id, websocket, user_name)

    user_count = manager.get_user_count(room_id)
    user_names = manager.get_user_names(room_id)

    print(
        f"[WebSocket] User connected to room "
        f"{room_id} | Users: {user_count}"
    )

    # Send the complete roster to the new participant, then notify everyone
    # already in the room about the updated roster.
    await websocket.send_json(
        {
            "type": "room_state",
            "room_id": room_id,
            "user_count": user_count,
            "participants": user_names,
        }
    )
    await manager.broadcast(
        room_id,
        {
            "type": "user_joined",
            "room_id": room_id,
            "user_count": user_count,
            "participants": user_names,
        },
        exclude=websocket,
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
        user_names = manager.get_user_names(room_id)

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
                "user_count": user_count,
                "participants": user_names,
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
