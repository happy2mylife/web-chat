//
// インターンでは触れないファイル
//

/**
 * イメージファイルをBASE64エンコードする
 * @param {*} imageFile 
 */
function convertImageToBase64(imageFile) {
    return new Promise( (resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        // readAsDataURLでファイルオブジェクトをbase64に変換
        reader.readAsDataURL(imageFile);    
    })
}

/**
 * 現在時刻を取得(hh:mm)
 */
function getCurrentTime() {
    const now = new Date();
    const hour = ('00' + now.getHours() ).slice(-2);
    const min = ('00' + now.getMinutes() ).slice(-2);
    return `${hour}:${min}`;
}

/**
 * 指定ノードの子要素を全て除去
 * @param {*} node 
 */
function removeAllChild(node) {
    for (let i=node.childNodes.length-1; i>=0; i--) {
        node.removeChild(node.childNodes[i]);
    }
}