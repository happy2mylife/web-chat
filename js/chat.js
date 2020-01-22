/**
 * ページの読み込みが完了した際の処理
 */
window.onload = () => {
    document.getElementById('selectImageBtn')
        .addEventListener('change', evt => {
            sendImage(evt.target.files[0]);
        }, false);
}

/**
 * 画像ファイルを送信
 * @param {*} imageFile 
 */
function sendImage(imageFile) {
    convertImageToBase64(imageFile).then(base64 => {
        const json = {
            "name": nickName.value,
            "type": MessageType.SendImage,
            "roomName": roomText.value,
            "base64": base64
        };            
        message = JSON.stringify(json);
        sock.send(message);
    });
}

/**
 * テキストメッセージを受信した際の処理
 * @param {*} json 
 */
function onReceivedMessage(json) {
    // === で比較
    if (isOwnMessage(json)) {
        addMessageElement(json, MessageOwner.Own);
    } else {
        addMessageElement(json, MessageOwner.Other);
    }
}

/**
 * 画像を受信した際の処理
 * @param {*} json 
 */
function onReceivedImage(json) {
    if (isOwnMessage(json)) {
        addImageElement(json, MessageOwner.Own);
    } else {
        addImageElement(json, MessageOwner.Other);
    }
}

/**
 * 自分自身のメッセージかどうか
 * @param {*} json 
 */
function isOwnMessage(json) {
    return json.name === nickName.value;
}

/**
 * チャット画面にテキストメッセージを追加
 * @param {*} json 
 * @param {*} messageOwner 
 */
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

function addImageElement(json, messageOwner) {
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

    const img = new Image();
    img.src = json.base64;
    img.classList.add("chat-" + elementName +"-image");

    // const imageElement = document.createElement("div");
    // imageElement.textContent = json.chatText;
    // imageElement.classList.add("chat-" + elementName +"-image");

    if (messageOwner == MessageOwner.Own) {
        // TODO 自身のメッセージタイムスタンプまだ
        // chatFrameElement.appendChild(timeStampElement);    
        chatFrameElement.appendChild(img);
    } else {
        chatFrameElement.appendChild(img);
        chatFrameElement.appendChild(timeStampElement);    
    }
    chatBox.appendChild(senderNameElement);
    chatBox.appendChild(chatFrameElement);

    // 自動で下にスクロールさせる
    chatBox.scrollTo(0, chatBox.scrollHeight);
}

function onRoomJoined(json) {
    clearRoomContents();

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
}

function clearRoomContents() {
    removeAllChild(chatBox);
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
        return;
    } else if (roomName.textContent.length == 0) {
        alert("ルームに入室してください。");
        return;
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
