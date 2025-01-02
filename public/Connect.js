class Connect {

    constructor( url ){
        this.playerList = [];
        this.socket = new WebSocket( url );
        this.socket.onopen = this.__handleSocketOpen.bind(this);
        this.socket.onclose = this.__handleSocketClose.bind(this);
        this.socket.onmessage = this.__handleWebSocketMessage.bind(this);
        this.onJoin = () => { };
        this.onLeave = () => {};
        this.onMove = () => {};
    }

    /* Private 私有方法 */
    __handleSocketOpen () {
        this.socket.send(JSON.stringify({ context: 'userReady' }));
    }

    /* Private 私有方法 */
    __handleSocketClose() {
        console.log('WebSocket 連接已經關閉');
    }

    /* Private 私有方法 */
    __handleWebSocketMessage( res ) {
        try {
            const data = JSON.parse( res.data );
            const handler = {
                'move': this.onMove,
                'join': this.onJoin,
                'leave': this.onLeave
            }[ data.context ];
            if ( handler ) { handler(data); }
            else { console.error(`接收到從伺服器傳來的未知的 context: ${data.context}`); }

        } catch ( error ) {
            console.error(`伺服器傳來的訊息轉換失敗: ${ error }`);
        }
       
    }

}

export default Connect;