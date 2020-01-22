const sock = new WebSocket("ws://127.0.0.1:5001");

sock.addEventListener("open", e => {
    console.log("接続が開かれたときに呼び出されるイベント");
});

sock.addEventListener("message", e => {
    console.log("サーバーからメッセージを受信したときに呼び出されるイベント");

    const json = JSON.parse(e.data);
    switch (json.type) {
        case MessageType.JoinRoom:
            onRoomJoined(json);
            break;
        case MessageType.SendMessage:
            onReceivedMessage(json);
            break;
        case MessageType.Connected:
            onConnected(json);
            break;
        case MessageType.ListMember:
            onListMember(json);
            break;
        case MessageType.SendImage:
            onReceivedImage(json);
            break;
        default:
            console.log("unknown message type.");

    }
});

sock.addEventListener("close", e => {
    console.log("接続が閉じられたときに呼び出されるイベント");
});

sock.addEventListener("error", e => {
    console.log("エラーが発生したときに呼び出されるイベント");
});
