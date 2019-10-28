
const MessageType = require('./node-enum.js');
const uuid = require('node-uuid');
const server = require("ws").Server;
const s = new server({ port: 5001 });
// https://www.pari.go.jp/unit/ydaku/fujita/nodejsWebSocket/
const rooms = {};
const clientConnections = [];

s.on("connection", ws => {

    // ip address を idとして扱う
    ws.clientId = ws._socket.remoteAddress.replace(/^.*:/g, '') + uuid.v4();
    clientConnections.push(ws);

    ws.on("message", message => {
        console.log("Received: " + message);

        const json = JSON.parse(message);
        if (json.type == MessageType.JoinRoom) {
            joinRoom(ws.clientId, json);
            sendMessageToClients(message);
        } else if (json.type == MessageType.SendMessage) {
            sendMessageToClientsInRoom(ws.clientId, json);
        }


        if (message === "hello") {
            ws.send("hello from server");
        }
    });

    ws.on("close", () => {
        // 当該クライアントをルームから退去
        leaveRoom(ws.clientId);
        deleteRoom();
        console.log(`${ws.clientId} connection is closed.`);
    });
});

/**
 * クライアントをルームに追加
 * @param {*} clientId 
 * @param {*} json
 * 
 * @return クライアントが入ったルーム 
 */
function joinRoom(clientId, json) {

    // ルームにまだ誰も入っていなければルームを作る
    if (json.room && !rooms[json.room]) {
        rooms[json.room] = [clientId];
    }

    const room = rooms[json.room];
    const client = room.find(c => c == clientId);
    if (!client) {
        room.push(clientId);
    }

    return room;
}

/**
 * クライアントをルームから削除
 * @param {*} clientId 
 */
function leaveRoom(clientId) {
    const room = getRoomByClientId(clientId);
    if (!room) {
        return;
    }

    const index = rooms[room].indexOf(clientId);
    if (index == -1) {
        return;
    }
    // 該当ルームからクライアントを退出
    rooms[room].splice(index, 1);
}

/**
 * クライアントが所属しているルームを取得
 * @param {*} clientId 
 */
function getRoomByClientId(clientId) {
    var room;
    for (var key in rooms) {
        if (rooms[key].find(c => c == clientId)) {
            room = key;
            break;
        } 
    }

    return room;
}

/**
 * クライアントが1人もいないルームは削除
 */
function deleteRoom() {
    // rooms.forEach((room, index) => {
    //     if (room.length == 0) {
    //         rooms.splice(index, 1);
    //     }
    // });
}

/**
 * 送信元が属するルームにいるクライアントにメッセージを送る
 * @param {*} json 
 */
function sendMessageToClientsInRoom(clientId, json) {
    const room = getRoomByClientId(clientId);

    // ルームに入っていなければ送らない
    if (!room) {
        console.log(`${clientId} is not joined any rooms.`);
        return;
    }

    const clients = clientConnections.filter(connection => {
        return connection.clientId != clientId;
    });

    clientConnections.forEach((connection) => {
        if (rooms[room].findIndex(id => id == connection.clientId) != -1) {
            message = JSON.stringify(json);
            connection.send(message);
        }
    });
}

function sendMessageToClients(message) {
    clientConnections.forEach(connection => {
        connection.send(message);
    })
}