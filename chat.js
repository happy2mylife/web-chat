

window.onload = () => {
    send.addEventListener("click", e => {
        var message = {
            "name": nickName.value,
            "type": MessageType.SendMessage,
            "room": roomText.value,
            "value": chatText.value  
        };
        message = JSON.stringify(message);
        sock.send(message);
    });

    joinRoom.addEventListener("click", e => {;
        if (!nickName.value) {
            alert('ニックネームを設定してください');
            return;
        } else if (!roomText.value) {
            alert('入室するルームをを設定してください');
            return;
        }
        var message = {
            "name": nickName.value,
            "type": MessageType.JoinRoom,
            "room": roomText.value
        }
        message = JSON.stringify(message);
        sock.send(message);
    });

    document.getElementById('image')
        .addEventListener('change', function (evt) {
            var file = evt.target.files[0];
            var reader = new FileReader();
            reader.onload = (event) => {
                bufferToBase64(reader.result, (b64) => {
                    var message = {
                        "id": "murase",
                        "type": "binary",
                        // バイナリ文字列をbase64に変換 btoa だと途中で欠けちゃう
                        // http://var.blog.jp/archives/62330155.html
                        // "data": btoa(reader.result)
                        "data": b64

                    };
                    message = JSON.stringify(message);
                    sock.send(message);

                    const img = new Image();
                    img.src = b64;
                    const main = document.getElementById('main');
                    main.appendChild(img);
                })

            };
            reader.readAsArrayBuffer(file);
        }, false);

}


const sock = new WebSocket("ws://127.0.0.1:5001");

sock.addEventListener("open", e => {
    console.log("接続が開かれたときに呼び出されるイベント");
});

sock.addEventListener("message", e => {
    console.log("サーバーからメッセージを受信したときに呼び出されるイベント");

    const json = JSON.parse(e.data);
    if (json.type == MessageType.JoinRoom) {
        onRoomJoined(json);
    } else {
        addReceivedMessage(json);
    }
});

sock.addEventListener("close", e => {
    console.log("接続が閉じられたときに呼び出されるイベント");
});

sock.addEventListener("error", e => {
    console.log("エラーが発生したときに呼び出されるイベント");
});

function bufferToBase64(buf, callback) {
    var blob = new Blob([buf], { type: "image/png" });
    var reader = new FileReader();
    reader.onload = function () {
        var b64 = reader.result;
        callback(b64);
    }
    reader.readAsDataURL(blob);
}

function addReceivedMessage(json) {
    // === で比較
    if (isOwnMessage(json)) {
        addOwnMessage(json);
    } else {
        addSenderMessage(json);
    }
}

function isOwnMessage(json) {
    return json.name === nickName.value;
}

/**
 * 相手のメッセージを表示
 */
function addSenderMessage(json) {
    const chatFrameElement = document.createElement("div");
    chatFrameElement.classList.add("chat-left-frame");

    const textElement = document.createElement("div");
    textElement.textContent = json.value;
    textElement.classList.add("chat-left-message");

    chatFrameElement.appendChild(textElement);
    chatBox.appendChild(chatFrameElement);
}

/**
 * 自身のメッセージを表示
 */
function addOwnMessage(json) {
    const chatFrameElement = document.createElement("div");
    chatFrameElement.classList.add("chat-right-frame");

    const textElement = document.createElement("div");
    textElement.textContent = json.value;
    textElement.classList.add("chat-right-message");

    chatFrameElement.appendChild(textElement);
    chatBox.appendChild(chatFrameElement);
}

function onRoomJoined(json) {
    // 自身がルーム入室した場合は、ルームタイトルにセット
    if (isOwnMessage(json)) {
        roomName.textContent = json.room;
    }

    // 新規ルームの場合はリストボックスに追加
    if (!isRoomAlreadyExist(json.room)) {
        // リストボックスにも列挙
        const optionElement = document.createElement("option");
        optionElement.value = roomSelector.length + 1;
        optionElement.text = json.room;
        roomSelector.appendChild(optionElement);
    }

    
    selectRoom(json.room);

}

/**
 * リストボックスに既に追加済みのルームかどうかをチェック
 * @param {*} roomName 
 */
function isRoomAlreadyExist(roomName) {
    for (let i = 0; i < roomSelector.options.length; i++) {
        if (roomSelector.options[i].text == roomName) {
            return true;
        } 
    }

    return false;
}

/**
 * 指定の名前のルームを選択状態にする
 * @param {*} roomName 
 */
function selectRoom(roomName) {
    for (let i = 0; i < roomSelector.options.length; i++) {
        if (roomSelector.options[i].text == roomName) {
            roomSelector.selectedIndex = i;
            break;
        } 
    }
}

/**
 * ルームが選択されたらテキストボックスに表示する
 */
function onRoomSelected() {
    roomText.value = roomSelector.options[roomSelector.selectedIndex].text;
}