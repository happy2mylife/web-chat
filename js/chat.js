// 選択スタンプの画像ファイル名
let stampImageFile;

/**
 * ページの読み込みが完了した際の処理
 */
window.onload = () => {
    document.getElementById('selectImageBtn')
        .addEventListener('change', evt => {
            stampImageFile = evt.target.files[0]
        }, false);
}

//
// サーバーにメッセージを送信する処理
//

/**
 * テキストメッセージ送信処理
 */
function sendMessage() {
    if (chatText.value.length === 0) {
        alert("メッセージを入力してください。");
        return;
    } else if (roomName.textContent.length === 0) {
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
 * スタンプ（画像）を送信
 */
function sendStamp() {
    if (!stampImageFile) {
        alert("スタンプを選択してください。");
        return;
    } else if (roomName.textContent.length === 0) {
        alert("ルームに入室してください。");
        return;
    }
    convertImageToBase64(stampImageFile).then(base64 => {
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
 * ルーム入室処理
 */
function sendJoinRoom() {

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
 * 選択されているルームのメンバーを表示
 */
function sendShowMember() {
    if (roomSelector.selectedIndex === -1) {
        alert("表示するルームを選択してください。");
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


//
// UIのボタン操作等の処理
//

/**
 * ルームが選択されたらテキストボックスに表示する
 */
function selectRoom() {
    roomText.value = roomSelector.options[roomSelector.selectedIndex].text;
}



//
// サーバーからメッセージを受信した際のイベント
//

/**
 * ルーム入室処理
 * @param {*} json 
 */
function onRoomJoined(json) {
    // チャット画面の表示を全てクリア
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

/**
 * テキストメッセージを受信した際の処理
 * @param {*} json 
 */
function onReceivedMessage(json) {
    if (isOwnMessage(json)) {
        addMessageElement(json, MessageOwner.Own);
    } else {
        addMessageElement(json, MessageOwner.Other);
    }
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
 * メンバー一覧表示
 * @param {*} json 
 */
function onListMember(json) {

    removeAllChild(memberTable);

    if (!json.members) {
        return;
    }

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


//
// その他
//

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
    if (messageOwner === MessageOwner.Own) {
        elementName = "right";
    } else {
        senderNameElement.textContent = json.name;
        senderNameElement.classList.add("sender-name");
        elementName = "left";
    }

    const chatFrameElement = document.createElement("div");
    chatFrameElement.classList.add("chat-" + elementName + "-frame");

    const timeStampElement = document.createElement("div");
    timeStampElement.textContent = getCurrentTime();
    timeStampElement.classList.add("timestamp-" + elementName);

    const textElement = document.createElement("div");
    textElement.textContent = json.chatText;
    textElement.classList.add("chat-" + elementName + "-message");

    if (messageOwner === MessageOwner.Own) {
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
    if (messageOwner === MessageOwner.Own) {
        elementName = "right";
    } else {
        senderNameElement.textContent = json.name;
        senderNameElement.classList.add("sender-name");
        elementName = "left";
    }

    const chatFrameElement = document.createElement("div");
    chatFrameElement.classList.add("chat-" + elementName + "-frame");

    const timeStampElement = document.createElement("div");
    timeStampElement.textContent = getCurrentTime();
    timeStampElement.classList.add("timestamp-" + elementName);

    const img = new Image();
    img.src = json.base64;
    img.classList.add("chat-" + elementName + "-image");

    if (messageOwner === MessageOwner.Own) {
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

/**
 * ルームの内容を削除
 */
function clearRoomContents() {
    removeAllChild(chatBox);
}