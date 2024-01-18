import io from 'socket.io-client';
// import { configDotenv } from 'dotenv';
// configDotenv();
class SocketDate {
  constructor() {
    if (SocketDate.instance) {
      return SocketDate.instance;
    }

    // this.socket = io(process.env.SOCKET);
    this.socket = io(
      'https://port-0-study-camp-socket-server-51ih2alri9k0f8.sel5.cloudtype.app',
    );

    window.addEventListener('beforeunload', () => {
      // 소켓 연결 해제
      this.socket.disconnect();
    });

    SocketDate.instance = this;
  }

  getIO() {
    return this.socket;
  }

  getID() {
    return this.socket.id;
  }

  updateSpace(tileX, tileY) {
    this.socket.emit('updateSpace', {
      id: this.socket.id,
      x: tileX,
      y: tileY,
    });
  }

  sendJoinSpacePlayer(tileX, tileY) {
    this.socket.emit('joinSpace', {
      id: this.socket.id,
      x: tileX,
      y: tileY,
    });
  }

  sendMovePlayer(tileX, tileY) {
    this.socket.emit('move', {
      id: this.socket.id,
      x: tileX,
      y: tileY,
    });
  }

  sendSitPlayer(isSit) {
    this.socket.emit('sit', {
      id: this.socket.id,
      isSit: isSit,
    });
  }

  sendChatMessage(message) {
    this.socket.emit('chat', {
      id: this.socket.id,
      message: message,
    });
  }
}

const SocketInstance = new SocketDate();

export default SocketInstance;
