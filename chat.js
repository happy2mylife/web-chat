

window.onload = () => {
    // TODO 直接HTMLにonclickで
    send.addEventListener("click", sendMessage);
    // TODO 直接HTMLにonclickで
    join.addEventListener("click", joinRoom);

    document.getElementById('image')
        .addEventListener('change', function (evt) {
            const file = evt.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                bufferToBase64(reader.result, (b64) => {
                    const json = {
                        "id": "murase",
                        "type": "binary",
                        // バイナリ文字列をbase64に変換 btoa だと途中で欠けちゃう
                        // http://var.blog.jp/archives/62330155.html
                        // "data": btoa(reader.result)
                        "data": b64

                    };
                    message = JSON.stringify(json);
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
    } else if (json.type == MessageType.SendMessage){
        addReceivedMessage(json);
    } else if (json.type == MessageType.Connected){
        onConnected(json);
    } else if (json.type == MessageType.ListMember){
        onListMember(json);
    } else {
        console.log("unknown message type.");
    }
});

sock.addEventListener("close", e => {
    console.log("接続が閉じられたときに呼び出されるイベント");
});

sock.addEventListener("error", e => {
    console.log("エラーが発生したときに呼び出されるイベント");
});

function bufferToBase64(buf, callback) {
    const blob = new Blob([buf], { type: "image/png" });
    const reader = new FileReader();
    reader.onload = function () {
        const b64 = reader.result;
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
    addMessageElement(json, MessageOwner.Other);
}

/**
 * 自身のメッセージを表示
 */
function addOwnMessage(json) {
    addMessageElement(json, MessageOwner.Own);
}

function getCurrentTime() {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes()}`;
}

function addMessageElement(json, messageOwner) {
    const senderNameElement = document.createElement("div");
    if (messageOwner == MessageOwner.Own) {
        elementName = "right";
    } else {
        senderNameElement.textContent = json.name;
        senderNameElement.classList.add("sender-name");
        elementName = "left";
    }

    const chatFrameElement = document.createElement("div");
    chatFrameElement.classList.add("chat-" + elementName +"-frame");

    const timeStampElement = document.createElement("div");
    timeStampElement.textContent = getCurrentTime();
    timeStampElement.classList.add("timestamp-" + elementName);

    const textElement = document.createElement("div");
    textElement.textContent = json.chatText;
    textElement.classList.add("chat-" + elementName +"-message");

    if (messageOwner == MessageOwner.Own) {
        // TODO 自身のメッセージタイムスタンプまだ
        // chatFrameElement.appendChild(timeStampElement);    
        chatFrameElement.appendChild(textElement);
    } else {
        chatFrameElement.appendChild(textElement);
        chatFrameElement.appendChild(timeStampElement);    
    }
    chatBox.appendChild(senderNameElement);
    chatBox.appendChild(chatFrameElement);

    // 自動で下にスクロールさせる
    chatBox.scrollTo(0, chatBox.scrollHeight);
}

function onRoomJoined(json) {
    // 自身がルーム入室した場合は、ルームタイトルにセット
    if (isOwnMessage(json)) {
        roomName.textContent = json.roomName;
    }

    // 新規ルームの場合はリストボックスに追加
    if (!isRoomAlreadyExist(json.roomName)) {
        // リストボックスにも列挙
        const optionElement = document.createElement("option");
        optionElement.value = roomSelector.length + 1;
        optionElement.text = json.roomName;
        roomSelector.appendChild(optionElement);
    }
    
    selectRoom(json.roomName);
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

/**
 * テキストメッセージ送信処理
 */
function sendMessage() {
    if (chatText.value.length == 0) {
        alert("メッセージを入力してください。");
    } else if (roomName.textContent.length == 0) {
        alert("ルームに入室してください。");
    }
    const json = {
        "name": nickName.value,
        "type": MessageType.SendMessage,
        "roomName": roomText.value,
        "chatText": chatText.value  
    };
    message = JSON.stringify(json);
    sock.send(message);
}

/**
 * ルーム入室処理
 */
function joinRoom() {

    // ニックネームや入室ルームが指定されていなければアラート表示
    if (!nickName.value) {
        alert('ニックネームを設定してください');
        return;
    } else if (!roomText.value) {
        alert('入室するルームをを設定してください');
        return;
    }

    const json = {
        "name": nickName.value,
        "type": MessageType.JoinRoom,
        "roomName": roomText.value
    }
    message = JSON.stringify(json);
    sock.send(message);
}

/**
 * コネクションが確立した時
 */
function onConnected(json) {
    json.rooms.forEach(room => {
        // リストボックスにも列挙
        const optionElement = document.createElement("option");
        optionElement.value = roomSelector.length + 1;
        optionElement.text = room.roomName;
        roomSelector.appendChild(optionElement);
    });
}

/**
 * 選択されているルームのメンバーを表示
 */
function showMember() {

    if (roomSelector.selectedIndex == -1) {
        // TODO ルームが選択されていない場合
        return;
    }

    const selectedRoom = roomSelector.options[roomSelector.selectedIndex].text;

    const json = {
        "name": nickName.value,
        "type": MessageType.ListMember,
        "roomName": selectedRoom
    }
    message = JSON.stringify(json);
    sock.send(message);
}

function onListMember(json) {
    if (!json.members) {
        return;
    }
    
    removeAllChild(memberTable);

    json.members.forEach(member => {
        // とりあえずログ表示
        console.log(`${member.name}`);

        // alert でも良い。

        // テーブルバージョン
        const td = document.createElement("td");
        const text = document.createTextNode(member.name);
        td.appendChild(text);

        const tr = document.createElement("tr");
        tr.appendChild(td);
        memberTable.appendChild(tr);
    });
}

function removeAllChild(node) {
    for (let i=node.childNodes.length-1; i>=0; i--) {
        node.removeChild(node.childNodes[i]);
    }
}