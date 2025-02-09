import SocketManager from '../managers/socket';
import SidebarOut from './sidebarOut';
import PlayerData from '../config/playerData.js';
import EditModal from './editModal';

import CreateLecutreModal from './createLectureModal.js';
import ShowLectureModal from './showLectureModal.js';
import ManagerModal from './managerModal.js';

import { requestAllMemeberIdBySpaceId } from '../utils/request.js';

import LogModal from './logModal.js';
import LogDateModal from './logDateModal.js';
import GroupModal from './groupModal.js';
import CodeCreateModal from './codeCreateModal.js';
import Singleton from '../utils/Singleton.js';

//https://app.gather.town/app/oizIaPbTdxnYzsKW/nbcamp_9_node
//TODO 다른 플레이어의 memberId와 userId가 제대로 안찍힌다.
//this.scene.otherPlayers[user].userId
//memberId에 제대로 된 값 저장하기
//socketId를 memberId로 바꾸기
export default class Sidebar extends Singleton {
  constructor() {
    super();
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'sidebar';
    // this.sidebar.classList.add('sidebar');
    document.body.appendChild(this.sidebar);

    //객체 확인용 테스트
    window.console.log('this.scene:', this.scene);
    window.console.log(
      'localStorage access token:',
      localStorage.getItem('access_token'),
    );

    //유저 정보 저장용 배열
    this.spaceUser = [];

    //DM검색 자동완성에서 이미 focused되었는지 확인하는 용도
    this.isDMInputfocused = false;
    //유저검색 자동완성에시 이미 focuesed되었는지 확인하는 용도
    this.isUserSearchInputFocused = false;
    //유저가 들어왔을때 몽고디비에서 전체채팅을 가져왔는지 확인하는 용도
    this.isGettingAllChat = false;
    //유저가 들어왔을때 몽고디비에서 DM을 가져왔는지 확인하는 용도
    this.isGettingAllDM = false;
    //현재 스페이스에 속한 유저 정보를 모킹해주는 용도
    this.isMockingOtherPlayers = false;

    //DM메세지 방 만들기용 객체
    this.directMessageRoomContainer = {};

    this.sidebar.style.height = '100vh';
    this.sidebar.style.width = '260px';
    this.sidebar.style.position = 'fixed';
    this.sidebar.style.zIndex = '2';
    this.sidebar.style.top = '0';
    this.sidebar.style.right = '-260px';
    this.sidebar.style.backgroundColor = '#a2cfff';
    this.sidebar.style.transition = 'left 0.5s, right 0.5s';
    this.sidebar.style.paddingTop = '60px';
    this.sidebar.style.boxSizing = 'border-box';
    this.sidebar.style.borderTop = '8px solid white';
    this.sidebar.style.borderBottom = '12px solid white';
    this.sidebar.style.borderLeft = '4px solid white';

    SidebarOut.getInstance();
    this.createInSideButtons();

    SocketManager.getInstance().subscribe(this.eventscallback.bind(this));
  }

  setScene(scene) {
    this.scene = scene;
    this.showSidebar();
  }

  hideSidebar() {
    this.sidebar.style.display = 'none';
  }

  showSidebar() {
    this.sidebar.style.display = 'block';
  }

  async mockingOtherPlayers() {
    const result = await requestAllMemeberIdBySpaceId(PlayerData.spaceId);
    console.log('mockingOtherPlayers=>', result);
    for (let i = 0; i < result.data.spaceMembers.length; i++) {
      this.scene.mockOtherPlayers[result.data.spaceMembers[i].id] = {};
      this.scene.mockOtherPlayers[result.data.spaceMembers[i].id].nickName =
        result.data.spaceMembers[i].user.nick_name;
    }
  }

  //인사이드버튼이 전챗관련이다.
  createInSideButtons() {
    this.insidebuttonbox = document.createElement('div');
    this.sidebar.classList.add('sidebar-buttonbox');
    this.insidebuttonbox.style.position = 'absolute';
    this.insidebuttonbox.style.top = '10px';
    this.insidebuttonbox.style.display = 'flex';
    this.insidebuttonbox.style.alignItems = 'center';
    this.insidebuttonbox.style.justifyContent = 'center';
    this.insidebuttonbox.style.gap = '5px';
    this.insidebuttonbox.style.left = '8px';
    this.sidebar.appendChild(this.insidebuttonbox);

    // 정보 수정 닉네임 스킨
    this.editBtn = document.createElement('button');
    this.editBtn.style.backgroundColor = 'white';
    this.editBtn.style.border = '2px solid white';
    this.editBtn.style.color = '#a2cfff';
    this.editBtn.style.padding = '4px';
    this.editBtn.innerHTML = `<span class="material-symbols-outlined">
    person
    </span>`;
    this.insidebuttonbox.appendChild(this.editBtn);
    this.editBtn.onclick = this.showContainers.bind(this, 'edit');
    this.createEditBox();

    //DM버튼
    //start: DM버튼을 만들어서 삽입한다.
    this.dmBtn = document.createElement('button');
    this.dmBtn.style.backgroundColor = 'white';
    this.dmBtn.style.border = '2px solid white';
    this.dmBtn.style.color = '#a2cfff';
    this.dmBtn.style.padding = '4px';
    this.dmBtn.innerHTML = `<span class="material-symbols-outlined">
    forum
    </span>`;
    this.insidebuttonbox.appendChild(this.dmBtn);
    //end: DM버튼을 만들어서 삽입한다.

    //DM박스를 만드는 함수
    this.createDMBox();
    //DM리스트를 만드는 함수
    this.createDMList();
    //#TODO 일단 여기서 보여주는거 바꿔야 한다.
    this.dmBtn.onclick = this.showContainers.bind(this, 'dmlist');

    // 구역 채팅
    this.groupChatBtn = document.createElement('button');
    this.groupChatBtn.style.backgroundColor = 'white';
    this.groupChatBtn.style.border = '2px solid white';
    this.groupChatBtn.style.color = '#a2cfff';
    this.groupChatBtn.style.padding = '4px';
    this.groupChatBtn.innerHTML = `<span class="material-symbols-outlined">
    chat_bubble
    </span>`;
    //구역채팅만드는 함수
    this.createGroupBox();
    this.insidebuttonbox.appendChild(this.groupChatBtn);
    this.groupChatBtn.onclick = this.showContainers.bind(this, 'group');

    //전체 채팅
    this.chatBtn = document.createElement('button');
    this.chatBtn.style.backgroundColor = 'white';
    this.chatBtn.style.border = '2px solid white';
    this.chatBtn.style.color = '#a2cfff';
    this.chatBtn.style.padding = '4px';
    this.chatBtn.innerHTML = `<span class="material-symbols-outlined">
    chat
    </span>`;
    this.insidebuttonbox.appendChild(this.chatBtn);
    this.createChatBox();
    this.chatBtn.onclick = this.showContainers.bind(this, 'chat');

    // 우편함
    this.mailBtn = document.createElement('button');
    this.mailBtn.style.backgroundColor = 'white';
    this.mailBtn.style.border = '2px solid white';
    this.mailBtn.style.color = '#a2cfff';
    this.mailBtn.style.padding = '4px';
    this.mailBtn.innerHTML = `<span class="material-symbols-outlined">
    mail
    </span>`;
    this.insidebuttonbox.appendChild(this.mailBtn);
    this.mailBtn.onclick = this.showContainers.bind(this, 'mail');

    // 접속자
    // 들어온 사람만.
    this.usersBtn = document.createElement('button');
    this.usersBtn.style.backgroundColor = 'white';
    this.usersBtn.style.border = '2px solid white';
    this.usersBtn.style.color = '#a2cfff';
    this.usersBtn.style.padding = '4px';
    this.usersBtn.innerHTML = `<span class="material-symbols-outlined">
    person_search
    </span>`;
    this.insidebuttonbox.appendChild(this.usersBtn);
    this.createUserSearchBox();
    this.usersBtn.onclick = this.showContainers.bind(this, 'users');
  }
  ////////////////////////////////////////////////////////

  hideContainers() {
    // 모든 탭들 다 안보이게 하기
    this.editContainer.style.display = 'none';
    this.chatContainer.style.display = 'none';
    this.directMessageContainer.style.display = 'none';
    this.directMessageListContainer.style.display = 'none';
    this.groupChatContainer.style.display = 'none';
    this.userSearchContainer.style.display = 'none';
    //TODO socketId -> memberId
    for (const otherPlayerMemberId in this.directMessageRoomContainer) {
      this.directMessageRoomContainer[otherPlayerMemberId].style.display =
        'none';
    }
  }

  //기존에 있던 모든 DM을 가져오는 함수입니다.
  //TODO socketID에서 유저ID로 교체
  //start: 기존의 모든 DM을 가져옵니다. 이때 가장 최근 메세지를 같이 보여줍니다.
  getAllDirectMessage() {
    while (this.directMessageListBox.firstChild) {
      this.directMessageListBox.removeChild(
        this.directMessageListBox.firstChild,
      );
    }
    for (const otherPlayerMemberId in this.directMessageRoomContainer) {
      if (
        this.directMessageRoomContainer[otherPlayerMemberId].chatBox.lastChild
      ) {
        //기존 다이렉트 메세지가 있는지 없는지도 봐야하네
        //window.console.log(this.directMessageRoomContainer[directMessageRoomContainer].chatBox.lastChild.innerHTML)
        window.console.log('mockOtherPlayers=>', this.scene.mockOtherPlayers);
        const directMessageDiv = document.createElement('div');
        directMessageDiv.style.marginTop = '10px';
        const nameDiv = document.createElement('div');
        nameDiv.style.color = 'white';
        nameDiv.style.fontWeight = 'bold';
        //TODO 문제 발생 지점
        nameDiv.innerHTML =
          this.scene.mockOtherPlayers[otherPlayerMemberId].nickName;
        const messageDiv = document.createElement('div');
        messageDiv.style.color = 'white';
        messageDiv.style.fontSize = '0.8rem';
        messageDiv.innerHTML = this.directMessageRoomContainer[
          otherPlayerMemberId
        ].chatBox.lastChild.innerHTML.replace(/<br>/g, ':');
        directMessageDiv.appendChild(nameDiv);
        directMessageDiv.appendChild(messageDiv);
        this.directMessageListBox.appendChild(directMessageDiv);
        //TODO socketID -> memberId
        this.directMessageListBox.onclick = () => {
          this.createDirectMessageRoom(
            otherPlayerMemberId,
            this.directMessageRoomContainer[otherPlayerMemberId]
              .otherPlayerSocketId,
          );
        };
      }
    }
  }
  //end: 기존의 모든 DM을 가져옵니다. 이때 가장 최근 메세지를 같이 보여줍니다.

  async showContainers(typestr) {
    this.hideContainers();
    switch (typestr) {
      case 'edit':
        this.editContainer.style.display = 'flex';
        break;
      case 'group':
        //이게 구역 채팅이래
        this.groupChatContainer.style.display = 'flex';
        break;
      case 'dm':
        this.directMessageContainer.style.display = 'flex';
        break;
      case 'dmlist':
        this.getAllDirectMessage();
        this.directMessageListContainer.style.display = 'flex';
        break;
      case 'chat':
        if (!this.isGettingAllChat) {
          //전채채팅 가져오는 로직
          SocketManager.getInstance().requestAllChat(PlayerData.spaceId);
          this.isGettingAllChat = true;
        }
        this.chatContainer.style.display = 'flex';
        break;
      case 'mail':
        break;
      case 'users':
        this.userSearchContainer.style.display = 'flex';
        break;
    }
  }

  createEditBox() {
    //유저 정보
    this.editContainer = document.createElement('div');
    this.editContainer.style.width = '95%';
    this.editContainer.style.height = '98%';
    this.editContainer.style.alignItems = 'center';
    this.editContainer.style.justifyContent = 'center';
    this.editContainer.style.display = 'flex';
    this.editContainer.style.flexDirection = 'column';
    this.editContainer.style.padding = '5px';
    this.sidebar.appendChild(this.editContainer);

    this.sideEditBoxText = document.createElement('h3');
    this.sideEditBoxText.innerText = PlayerData.nickName;
    this.sideEditBoxText.style.color = 'white';
    this.sideEditBoxText.style.fontWeight = 'bold';
    this.editContainer.appendChild(this.sideEditBoxText);

    this.sideEditBox = document.createElement('div');
    this.sideEditBox.style.height = '90vh';
    this.sideEditBox.style.width = '100%';
    // this.sideEditBox.style.backgroundColor = 'white';
    this.editContainer.appendChild(this.sideEditBox);

    // 아바타 꾸미기 버튼
    const editbutton = document.createElement('button');
    editbutton.style.padding = '0px';
    editbutton.style.width = '100%';
    editbutton.style.backgroundColor = 'white';
    editbutton.style.border = '2px solid white';
    editbutton.style.color = '#a2cfff';
    editbutton.innerHTML = `<p><span class="material-symbols-outlined">
    apparel
    </span> 아바타 꾸미기</p>`;
    editbutton.onclick = () => {
      this.editModal.openModal();
    };
    this.sideEditBox.appendChild(editbutton);
    this.editModal = new EditModal();

    // 로비로 돌아가기 버튼
    const loddybutton = document.createElement('button');
    loddybutton.style.padding = '0px';
    loddybutton.style.width = '100%';
    loddybutton.style.backgroundColor = 'white';
    loddybutton.style.border = '2px solid white';
    loddybutton.style.color = '#a2cfff';
    loddybutton.innerHTML = `<p><span class="material-symbols-outlined">
    door_open
    </span> 돌아가기</p>`;
    loddybutton.onclick = () => {
      // lobby scene
      // this.hideSidebar();
      // this.scene.scene.start('LoddyScene');
    };
    this.sideEditBox.appendChild(loddybutton);

    if (PlayerData.role === '0') {
      // 입장 코드 생성 버튼
      const codebutton = document.createElement('button');
      codebutton.style.padding = '0px';
      codebutton.style.width = '100%';
      codebutton.style.backgroundColor = 'white';
      codebutton.style.border = '2px solid white';
      codebutton.style.color = '#a2cfff';
      codebutton.innerHTML = `<p><span class="material-symbols-outlined">
    vpn_key
    </span> 입장 코드 생성</p>`;
      codebutton.onclick = () => {
        this.codeCreateModal.openModal();
      };
      this.sideEditBox.appendChild(codebutton);
      this.codeCreateModal = new CodeCreateModal();
    }

    if (PlayerData.role === '0' || PlayerData.role === '1') {
      // 멤버 관리 버튼
      const memberbutton = document.createElement('button');
      memberbutton.style.padding = '0px';
      memberbutton.style.width = '100%';
      memberbutton.style.backgroundColor = 'white';
      memberbutton.style.border = '2px solid white';
      memberbutton.style.color = '#a2cfff';
      memberbutton.innerHTML = `<p><span class="material-symbols-outlined">
    person
    </span> 멤버 관리</p>`;
      memberbutton.onclick = () => {
        this.memberModal.openModal();
      };
      this.sideEditBox.appendChild(memberbutton);
      this.memberModal = new ManagerModal();
    }

    if (PlayerData.role === '0' || PlayerData.role === '1') {
      // 출석 관리 버튼
      const logbutton = document.createElement('button');
      logbutton.style.padding = '0px';
      logbutton.style.width = '100%';
      logbutton.style.backgroundColor = 'white';
      logbutton.style.border = '2px solid white';
      logbutton.style.color = '#a2cfff';
      logbutton.innerHTML = `<p><span class="material-symbols-outlined">
    how_to_reg
    </span> 출석 관리</p>`;
      this.logDateModal = new LogDateModal();
      logbutton.onclick = this.logDateModal.openModal.bind(this.logDateModal);
      this.sideEditBox.appendChild(logbutton);
    }

    if (
      PlayerData.role === '0' ||
      PlayerData.role === '1' ||
      PlayerData.role === '2'
    ) {
      // 그룹 관리 버튼
      const groupbutton = document.createElement('button');
      groupbutton.style.padding = '0px';
      groupbutton.style.width = '100%';
      groupbutton.style.backgroundColor = 'white';
      groupbutton.style.border = '2px solid white';
      groupbutton.style.color = '#a2cfff';
      groupbutton.innerHTML = `<p><span class="material-symbols-outlined">
    groups_3
    </span> 그룹 관리</p>`;
      this.groupModal = new GroupModal();
      groupbutton.onclick = async () => {
        this.groupModal.openModal();
      };
      this.sideEditBox.appendChild(groupbutton);
    }

    if (PlayerData.role === '0') {
      // 강의 관리 버튼
      const lecturebutton = document.createElement('button');
      lecturebutton.style.padding = '0px';
      lecturebutton.style.width = '100%';
      lecturebutton.style.backgroundColor = 'white';
      lecturebutton.style.border = '2px solid white';
      lecturebutton.style.color = '#a2cfff';
      lecturebutton.innerHTML = `<p><span class="material-symbols-outlined">
    slideshow
    </span> 강의 관리</p>`;
      lecturebutton.onclick = () => {
        ShowLectureModal.getInstance().openModal();
        CreateLecutreModal.getInstance().closeModal();
      };
      this.sideEditBox.appendChild(lecturebutton);
    }

    if (PlayerData.role === '0' || PlayerData.role === '1') {
      // 브로드캐스트 관리 버튼
      const brodcastbutton = document.createElement('button');
      brodcastbutton.style.padding = '0px';
      brodcastbutton.style.width = '100%';
      brodcastbutton.style.backgroundColor = 'white';
      brodcastbutton.style.border = '2px solid white';
      brodcastbutton.style.color = '#a2cfff';
      brodcastbutton.innerHTML = `<p><span class="material-symbols-outlined">
    campaign
    </span> 브로드캐스트</p>`;
      brodcastbutton.onclick = () => {};
      this.sideEditBox.appendChild(brodcastbutton);
    }

    if (PlayerData.role === '3') {
      // 내강의 보기
      const myLecturebutton = document.createElement('button');
      myLecturebutton.style.padding = '0px';
      myLecturebutton.style.width = '100%';
      myLecturebutton.style.backgroundColor = 'white';
      myLecturebutton.style.border = '2px solid white';
      myLecturebutton.style.color = '#a2cfff';
      myLecturebutton.innerHTML = `<p><span class="material-symbols-outlined">
      slideshow
    </span> 강의 보기</p>`;
      myLecturebutton.onclick = () => {};
      this.sideEditBox.appendChild(myLecturebutton);

      // 내 출석 보기
      const myLogbutton = document.createElement('button');
      myLogbutton.style.padding = '0px';
      myLogbutton.style.width = '100%';
      myLogbutton.style.backgroundColor = 'white';
      myLogbutton.style.border = '2px solid white';
      myLogbutton.style.color = '#a2cfff';
      myLogbutton.innerHTML = `<p><span class="material-symbols-outlined">
      how_to_reg
    </span> 출석 보기</p>`;
      this.logModal = new LogModal(PlayerData.userId);
      myLogbutton.onclick = this.logModal.openModal.bind(this.logModal);
      this.sideEditBox.appendChild(myLogbutton);
    }
  }

  createGroupBox() {
    this.groupChatContainer = document.createElement('div');
    this.groupChatContainer.style.width = '95%';
    this.groupChatContainer.style.height = '98%';
    this.groupChatContainer.style.alignItems = 'center';
    this.groupChatContainer.style.justifyContent = 'center';
    this.groupChatContainer.style.display = 'none';
    this.groupChatContainer.style.flexDirection = 'column';
    this.groupChatContainer.style.padding = '5px';
    this.sidebar.appendChild(this.groupChatContainer);

    this.groupChatBoxText = document.createElement('h3');
    this.groupChatBoxText.innerText = '구역 채팅';
    this.groupChatBoxText.style.color = 'white';
    this.groupChatBoxText.style.fontWeight = 'bold';
    this.groupChatContainer.appendChild(this.groupChatBoxText);

    this.groupChatBox = document.createElement('div');
    this.groupChatBox.style.height = '80vh';
    this.groupChatBox.style.width = '100%';
    this.groupChatBox.style.overflowY = 'auto';
    this.groupChatBox.style.transition = 'transform 0.3s ease-in-out';
    this.groupChatBox.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.1)';
    this.groupChatContainer.appendChild(this.groupChatBox);

    this.groupChatInput = document.createElement('input');
    this.groupChatInput.style.border = '1px solid white';
    this.groupChatInput.style.borderRadius = '5px';
    this.groupChatInput.style.width = '100%';
    this.groupChatInput.style.backgroundColor = 'transparent';
    this.groupChatInput.style.marginTop = '10px';
    this.groupChatInput.style.color = 'white';
    this.groupChatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.value) {
        SocketManager.getInstance().sendGroupChatMessage(
          this.scene.room,
          event.target.value,
        );
        event.target.value = '';
      }
    });
    this.groupChatContainer.appendChild(this.groupChatInput);
  }

  //전체 채팅을 만듭니다.
  createChatBox() {
    this.chatContainer = document.createElement('div');
    this.chatContainer.style.width = '95%';
    this.chatContainer.style.height = '98%';
    this.chatContainer.style.alignItems = 'center';
    this.chatContainer.style.justifyContent = 'center';
    this.chatContainer.style.display = 'flex';
    this.chatContainer.style.flexDirection = 'column';
    this.chatContainer.style.padding = '5px';
    this.sidebar.appendChild(this.chatContainer);

    this.sideChatBoxText = document.createElement('h3');
    this.sideChatBoxText.innerText = '전체 채팅';
    this.sideChatBoxText.style.color = 'white';
    this.sideChatBoxText.style.fontWeight = 'bold';
    this.chatContainer.appendChild(this.sideChatBoxText);

    this.sideChatBox = document.createElement('div');
    this.sideChatBox.style.height = '80vh';
    this.sideChatBox.style.width = '100%';
    this.sideChatBox.style.overflowY = 'auto';
    this.sideChatBox.style.transition = 'transform 0.3s ease-in-out';
    this.sideChatBox.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.1)';
    this.chatContainer.appendChild(this.sideChatBox);

    this.sideChatInput = document.createElement('input');
    this.sideChatInput.style.border = '1px solid white';
    this.sideChatInput.style.borderRadius = '5px';
    this.sideChatInput.style.width = '100%';
    this.sideChatInput.style.backgroundColor = 'transparent';
    this.sideChatInput.style.marginTop = '10px';
    this.sideChatInput.style.color = 'white';
    this.sideChatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.value) {
        SocketManager.getInstance().sendChatMessage(
          event.target.value,
          PlayerData.spaceId,
        );
        event.target.value = '';
      }
    });
    this.chatContainer.appendChild(this.sideChatInput);
  }

  //DM List를 만듭니다.
  createDMList() {
    //처음은 목록부터 보여줘야 한다.
    this.directMessageListContainer = document.createElement('div');
    this.directMessageListContainer.style.width = '95%';
    this.directMessageListContainer.style.height = '98%';
    this.directMessageListContainer.style.alignItems = 'center';
    this.directMessageListContainer.style.justifyContent = 'center';
    this.directMessageListContainer.style.display = 'none';
    this.directMessageListContainer.style.flexDirection = 'column';
    this.directMessageListContainer.style.padding = '5px';
    this.sidebar.appendChild(this.directMessageListContainer);

    this.directMessageListBox = document.createElement('div');
    this.directMessageListBox.style.height = '80vh';
    this.directMessageListBox.style.width = '100%';
    this.directMessageListBox.style.overflowY = 'auto';
    this.directMessageListBox.style.transition = 'transform 0.3s ease-in-out';
    this.directMessageListBox.style.boxShadow =
      'inset 0 0 10px rgba(0, 0, 0, 0.1)';
    this.directMessageListContainer.appendChild(this.directMessageListBox);

    this.directMessageBtn = document.createElement('button');
    this.directMessageBtn.style.border = '1px solid white';
    this.directMessageBtn.style.borderRadius = '5px';
    this.directMessageBtn.style.width = '100%';
    this.directMessageBtn.style.backgroundColor = 'transparent';
    this.directMessageBtn.style.marginTop = '10px';
    this.directMessageBtn.style.color = 'white';
    this.directMessageBtn.textContent = 'New Message';
    this.directMessageListContainer.appendChild(this.directMessageBtn);
    this.directMessageBtn.onclick = this.showContainers.bind(this, 'dm');
  }

  //DM을 보내기 위해 유저를 검색하는 구역 만드는 함수.
  createDMBox() {
    //게더랑 비슷하게 만들어보자.
    this.inputContainer = document.createElement('span');

    const toText = document.createElement('span');
    toText.textContent = 'to: ';
    toText.style.color = 'white';

    this.directMessageContainer = document.createElement('div');
    this.directMessageContainer.style.width = '95%';
    this.directMessageContainer.style.height = '98%';
    this.directMessageContainer.style.alignItems = 'center';
    this.directMessageContainer.style.display = 'none';
    this.directMessageContainer.style.flexDirection = 'column';
    this.directMessageContainer.style.padding = '5px';
    this.sidebar.appendChild(this.directMessageContainer);

    this.directMessageInput = document.createElement('input');
    this.directMessageInput.setAttribute('placeholder', 'Select user');
    this.directMessageInput.style.border = '1px solid white';
    this.directMessageInput.style.borderRadius = '5px';

    this.directMessageInput.style.width = 'auto';
    this.directMessageInput.style.backgroundColor = 'transparent';
    this.directMessageInput.style.marginTop = '10px';
    this.directMessageInput.style.color = 'white';
    //blur이벤트 넣음
    this.directMessageInput.addEventListener('blur', () => {
      //이 방법보다 좋은 방법을 찾으면 좋겠다.
      setTimeout(() => {
        this.directMessageInput.value = '';
        this.directMessageBox.style.display = 'none';
        while (this.directMessageBox.firstChild) {
          this.directMessageBox.removeChild(this.directMessageBox.firstChild);
        }
        this.isDMInputfocused = false;
      }, 100);
    });

    //start: 자동완성 기능 넣어줌
    this.directMessageInput.addEventListener('keyup', () => {
      const inputValue = this.directMessageInput.value.toLowerCase();

      for (const userArray of this.spaceUser) {
        const userId = userArray[0];
        const divElement = document.getElementById(userId);
        if (divElement) {
          divElement.style.display = 'none';
        }
      }
      //end: 자동완성 기능 넣어줌.
      //////////////////////////////////////////////////////////////////////////////////////
      //start: 현재 접속한 인원의 아이디와 닉네임을 userArray에 넣음.
      for (const userArray of this.spaceUser) {
        const userId = userArray[0];
        const nickname = userArray[1].toLowerCase(); // 닉네임을 소문자로 변환
        const divElement = document.getElementById(userId);

        if (divElement && nickname.startsWith(inputValue)) {
          divElement.style.display = 'block';
        }
      }
    });
    //end: 현재 접속한 인원의 아이디와 닉네임을 userArray에 넣음.

    //start: directMessageInput은 to 다음에 나오는 검색창이다.
    //추가정보: 이미 포커스를 받은 상태라면 새로 갱신해줄 이유가 없어 return하는 것이다.
    this.directMessageInput.addEventListener('focus', () => {
      if (this.isDMInputfocused) {
        return;
      }
      this.isDMInputfocused = true;

      while (this.directMessageBox.firstChild) {
        this.directMessageBox.removeChild(this.directMessageBox.firstChild);
      }
      this.directMessageBox.style.display = 'block';

      //start: spaceUser에 현재 유저소켓아이디와 유저 닉네임을 넣는다.
      //TODO socketID에서 유저ID로 교체
      this.spaceUser = [];
      for (const user in this.scene.otherPlayers) {
        if (this.scene.otherPlayers[user]) {
          //DONE socketID to userId
          this.spaceUser.push([
            this.scene.otherPlayers[user].memberId,
            this.scene.otherPlayers[user].nickName,
            user,
          ]);
          //this.spaceUser.push([user, this.scene.otherPlayers[user].nickName]);
        }
      }
      //end: spaceUser에 현재 유저소켓아이디와 유저 닉네임을 넣는다.

      //start: DM메세지를 보낼 수 있는 유저들을 가져온 뒤 DMBOX에 넣는다.
      for (const userArray of this.spaceUser) {
        const memberId = userArray[0];
        const nickname = userArray[1];
        //div안에 유저 이름과 속성으로 id를 줄 것이다.
        const divElement = document.createElement('div');
        //TODO socketID에서 유저ID로 교체
        divElement.setAttribute('id', memberId);
        divElement.innerHTML = `${nickname}`;

        divElement.style.width = 'auto';
        divElement.style.backgroundColor = 'transparent';
        divElement.style.marginTop = '5px';
        divElement.style.marginBottom = '5px';
        divElement.style.marginLeft = '5px';
        divElement.style.color = 'white';
        divElement.addEventListener('click', () => {
          this.createDirectMessageRoom(divElement.id, userArray[2]);
        });

        this.directMessageBox.appendChild(divElement);
      }
      //end: DM메세지를 보낼 수 있는 유저들을 가져온 뒤 DMBOX에 넣는다.
    });

    this.inputContainer.appendChild(toText);
    this.inputContainer.appendChild(this.directMessageInput);

    this.directMessageContainer.appendChild(this.inputContainer);

    //여길 꾸며줘야 한다.
    this.directMessageBox = document.createElement('div');
    this.directMessageBox.style.height = 'auto';
    this.directMessageBox.style.width = '80%';
    this.directMessageBox.style.borderRadius = '10px';
    // 왼쪽 여백 추가
    this.directMessageBox.style.marginLeft = '10%';
    this.directMessageBox.style.overflowY = 'auto';
    this.directMessageBox.style.transition = 'transform 0.3s ease-in-out';
    this.directMessageBox.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.1)';
    this.directMessageBox.style.display = 'none';
    this.directMessageBox.style.backgroundColor = '#7d83fa';
    this.directMessageContainer.appendChild(this.directMessageBox);
  }

  //TODO socketID에서 유저ID로 교체
  //여기가 근본원인
  createDirectMessageRoom(otherPlayerMemberId, otherPlayerSocketId) {
    this.hideContainers();
    //궁극적으로 여길 고쳐야 한다.
    if (this.directMessageRoomContainer[otherPlayerMemberId]) {
      this.directMessageRoomContainer[otherPlayerMemberId].otherPlayerSocketId =
        otherPlayerSocketId;
      this.directMessageRoomContainer[otherPlayerMemberId].style.display =
        'flex';
      console.log('otherPlayerSocketId =>', otherPlayerSocketId);
      return;
    }
    //일단 컨테이너에 넣어야 나중에 안보이게 하기 편하다.
    //this.directMessageRoomContainer = {};

    this.directMessageRoomContainer[otherPlayerMemberId] =
      document.createElement('div');
    //기억해야 할 부분
    this.directMessageRoomContainer[otherPlayerMemberId].otherPlayerSocketId =
      otherPlayerSocketId;
    this.directMessageRoomContainer[otherPlayerMemberId].style.width = '95%';
    this.directMessageRoomContainer[otherPlayerMemberId].style.height = '98%';
    this.directMessageRoomContainer[otherPlayerMemberId].style.alignItems =
      'center';
    this.directMessageRoomContainer[otherPlayerMemberId].style.justifyContent =
      'center';
    this.directMessageRoomContainer[otherPlayerMemberId].style.display = 'flex';
    this.directMessageRoomContainer[otherPlayerMemberId].style.flexDirection =
      'column';
    this.directMessageRoomContainer[otherPlayerMemberId].style.padding = '5px';
    this.sidebar.appendChild(
      this.directMessageRoomContainer[otherPlayerMemberId],
    );

    this.directMessageRoomContainer[otherPlayerMemberId].chatBox =
      document.createElement('div');
    this.directMessageRoomContainer[otherPlayerMemberId].chatBox.style.height =
      '80vh';
    this.directMessageRoomContainer[otherPlayerMemberId].chatBox.style.width =
      '100%';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatBox.style.overflowY = 'auto';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatBox.style.transition = 'transform 0.3s ease-in-out';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatBox.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.1)';
    this.directMessageRoomContainer[otherPlayerMemberId].appendChild(
      this.directMessageRoomContainer[otherPlayerMemberId].chatBox,
    );

    this.directMessageRoomContainer[otherPlayerMemberId].chatInput =
      document.createElement('input');
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.style.border = '1px solid white';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.style.borderRadius = '5px';
    this.directMessageRoomContainer[otherPlayerMemberId].chatInput.style.width =
      '100%';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.style.backgroundColor = 'transparent';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.style.marginTop = '10px';
    this.directMessageRoomContainer[otherPlayerMemberId].chatInput.style.color =
      'white';

    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.addEventListener('keydown', (event) => {
      if (
        event.key === 'Enter' &&
        event.target.value &&
        this.scene.otherPlayers[
          this.directMessageRoomContainer[otherPlayerMemberId]
            .otherPlayerSocketId
        ]
      ) {
        const item = document.createElement('div');
        item.innerHTML = `나<br>${event.target.value}`;
        item.style.color = 'white';
        this.directMessageRoomContainer[
          otherPlayerMemberId
        ].chatBox.appendChild(item);
        //TODO 문제 발생지점
        //소켓ID를 통해 찾으려 하면 못 찾는다.
        //TODO 2024 01 28
        //this.scene.otherPlayers[otherPlayerSocketId].nickName,
        //상대방의 닉네임을 줘야 한다.
        //버그가 발견되었다.
        //버그가 발견되었다.
        console.log(
          'SocketManager.getInstance().sendDirectMessageToPlayer()',
          this.directMessageRoomContainer[otherPlayerMemberId]
            .otherPlayerSocketId,
          this.scene.player.nickName,
          this.scene.mockOtherPlayers[otherPlayerMemberId].nickName,
          event.target.value,
        );
        //이 부분을 고쳐야 한다.
        SocketManager.getInstance().sendDirectMessageToPlayer(
          this.directMessageRoomContainer[otherPlayerMemberId]
            .otherPlayerSocketId,
          this.scene.player.nickName,
          this.scene.mockOtherPlayers[otherPlayerMemberId].nickName,
          event.target.value,
        );
        //여기 추가해야 하나 나한테도 올라와야 하니
        window.console.log('다이렉트 메세지 보냄');
        event.target.value = '';
      }
    });
    /////
    this.directMessageRoomContainer[otherPlayerMemberId].appendChild(
      this.directMessageRoomContainer[otherPlayerMemberId].chatInput,
    );
  }

  //유저 검색 박스를 만듭니다.
  createUserSearchBox() {
    this.userSearchContainer = document.createElement('div');
    this.userSearchContainer.style.width = '95%';
    this.userSearchContainer.style.height = '98%';
    this.userSearchContainer.style.alignItems = 'center';
    this.userSearchContainer.style.display = 'none';
    this.userSearchContainer.style.flexDirection = 'column';
    this.userSearchContainer.style.padding = '5px';
    this.sidebar.appendChild(this.userSearchContainer);

    this.userSearchInput = document.createElement('input');
    this.userSearchInput.setAttribute('placeholder', 'Search user');
    this.userSearchInput.style.border = '1px solid white';
    this.userSearchInput.style.borderRadius = '5px';

    this.userSearchInput.style.width = '70%';
    this.userSearchInput.style.backgroundColor = 'transparent';
    this.userSearchInput.style.marginTop = '10px';
    this.userSearchInput.style.color = 'white';
    //blur이벤트 넣음
    this.userSearchInput.addEventListener('blur', () => {
      //이 방법보다 좋은 방법을 찾으면 좋겠다.
      setTimeout(() => {
        this.userSearchInput.value = '';
        this.userSearchBox.style.display = 'none';
        while (this.userSearchBox.firstChild) {
          this.userSearchBox.removeChild(this.userSearchBox.firstChild);
        }
        this.isUserSearchInputFocused = false;
      }, 100);
    });

    //start: 자동완성 기능 넣어줌
    this.userSearchInput.addEventListener('keyup', () => {
      const inputValue = this.userSearchInput.value.toLowerCase();

      for (const userArray of this.spaceUser) {
        const userId = userArray[0];
        const divElement = document.getElementById(userId);
        if (divElement) {
          divElement.style.display = 'none';
        }
      }
      //end: 자동완성 기능 넣어줌.
      //////////////////////////////////////////////////////////////////////////////////////
      //start: 현재 접속한 인원의 아이디와 닉네임을 userArray에 넣음.
      for (const userArray of this.spaceUser) {
        const userId = userArray[0];
        const nickname = userArray[1].toLowerCase(); // 닉네임을 소문자로 변환
        const divElement = document.getElementById(userId);

        if (divElement && nickname.startsWith(inputValue)) {
          divElement.style.display = 'block';
        }
      }
    });
    //end: 현재 접속한 인원의 아이디와 닉네임을 userArray에 넣음.

    //start: directMessageInput은 to 다음에 나오는 검색창이다.
    //추가정보: 이미 포커스를 받은 상태라면 새로 갱신해줄 이유가 없어 return하는 것이다.
    this.userSearchInput.addEventListener('focus', () => {
      if (this.isUserSearchInputFocused) {
        return;
      }
      this.isUserSearchInputFocused = true;

      while (this.userSearchBox.firstChild) {
        this.userSearchBox.removeChild(this.userSearchBox.firstChild);
      }
      this.userSearchBox.style.display = 'block';

      //start: spaceUser에 현재 유저소켓아이디와 유저 닉네임을 넣는다.
      //TODO socketID에서 유저ID로 교체
      this.spaceUser = [];
      for (const user in this.scene.otherPlayers) {
        if (this.scene.otherPlayers[user]) {
          //DONE socketID to userId
          this.spaceUser.push([
            this.scene.otherPlayers[user].memberId,
            this.scene.otherPlayers[user].nickName,
            user,
          ]);
          //this.spaceUser.push([user, this.scene.otherPlayers[user].nickName]);
        }
      }
      //end: spaceUser에 현재 유저소켓아이디와 유저 닉네임을 넣는다.

      //start: DM메세지를 보낼 수 있는 유저들을 가져온 뒤 DMBOX에 넣는다.
      for (const userArray of this.spaceUser) {
        const memberId = userArray[0];
        const nickname = userArray[1];
        //div안에 유저 이름과 속성으로 id를 줄 것이다.
        const divElement = document.createElement('div');
        //TODO socketID에서 유저ID로 교체
        divElement.setAttribute('id', memberId);
        divElement.innerHTML = `${nickname}`;

        divElement.style.width = 'auto';
        divElement.style.backgroundColor = 'transparent';
        divElement.style.marginTop = '5px';
        divElement.style.marginBottom = '5px';
        divElement.style.marginLeft = '5px';
        divElement.style.color = 'white';
        divElement.addEventListener('click', () => {});

        this.userSearchBox.appendChild(divElement);
      }
      //end: DM메세지를 보낼 수 있는 유저들을 가져온 뒤 DMBOX에 넣는다.
    });
    this.searchContainer = document.createElement('div');

    const toText = document.createElement('span');
    toText.textContent = 'Search: ';
    toText.style.color = 'white';

    this.searchContainer.appendChild(toText);
    this.searchContainer.appendChild(this.userSearchInput);

    this.userSearchContainer.appendChild(this.searchContainer);

    //여길 꾸며줘야 한다.
    this.userSearchBox = document.createElement('div');
    this.userSearchBox.style.height = '100%';
    this.userSearchBox.style.width = '100%';
    // this.userSearchBox.style.borderRadius = '10px';
    // 왼쪽 여백 추가
    this.userSearchBox.style.overflowY = 'auto';
    this.userSearchBox.style.transition = 'transform 0.3s ease-in-out';
    this.userSearchBox.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.1)';
    this.userSearchBox.style.display = 'none';
    this.userSearchBox.style.border = '1px solid white';
    this.userSearchBox.style.backgroundColor = 'transparent';
    this.userSearchContainer.appendChild(this.userSearchBox);
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////////////
  //#
  chatMessage(nickName, msg) {
    const item = document.createElement('div');
    item.innerHTML = `${nickName}<br>${msg}`;
    item.style.color = 'white';
    this.sideChatBox.appendChild(item);
    this.sideChatBox.scrollTop = this.sideChatBox.scrollHeight;
  }

  chatInGroup(nickName, msg) {
    const item = document.createElement('div');
    item.innerHTML = `${nickName}<br>${msg}`;
    item.style.color = 'white';
    this.groupChatBox.appendChild(item);
    this.groupChatBox.scrollTop = this.groupChatBox.scrollHeight;
  }

  //eventscallback에 넣는 함수
  //senderId가 소켓아이디일것이다.
  //TODO sockerId -> memberId
  directMessage(otherPlayerSocketId, msg) {
    const otherPlayerMemberId =
      this.scene.otherPlayers[otherPlayerSocketId].memberId;
    const nickname = this.scene.otherPlayers[otherPlayerSocketId].nickName;
    const item = document.createElement('div');
    item.innerHTML = `${nickname}<br>${msg}`;
    item.style.color = 'white';
    //TODO socketID에서 유저ID로 교체
    if (!this.directMessageRoomContainer[otherPlayerMemberId]) {
      //div안에 유저 이름과 속성으로 id를 줄 것이다.
      const divElement = document.createElement('div');
      divElement.setAttribute('id', otherPlayerMemberId);
      divElement.innerHTML = `${nickname}`;

      divElement.style.width = 'auto';
      divElement.style.backgroundColor = 'transparent';
      divElement.style.marginTop = '10px';
      divElement.style.color = 'white';
      this.createDirectMessageRoom(divElement.id, otherPlayerSocketId);
    } else {
      this.hideContainers();
      this.directMessageRoomContainer[otherPlayerMemberId].style.display =
        'flex';
    }
    this.directMessageRoomContainer[otherPlayerMemberId].chatBox.appendChild(
      item,
    );
    this.directMessageRoomContainer[otherPlayerMemberId].chatBox.scrollTop =
      this.directMessageRoomContainer[otherPlayerMemberId].chatBox.scrollHeight;
  }

  addAllChatHistory(data) {
    window.console.log('addAllChatHistory', data.chats);
    for (let i = 0; i < data.chats.length; i++) {
      this.chatMessage(data.chats[i].nick_name, data.chats[i].message);
    }
  }

  addAllDMHistory(data) {
    window.console.log('addAllDMHistory', data);
    for (let i = 0; i < data.directMessages.length; i++) {
      this.createDirectMessageRoomByDMHistory(
        data.directMessages[i].getter_id,
        data.directMessages[i].getter_nick,
        data.directMessages[i].sender_id,
        data.directMessages[i].sender_nick,
      );
    }
    for (let i = 0; i < data.directMessages.length; i++) {
      this.addDirectMessageByDMHistory(
        data.directMessages[i].getter_id,
        data.directMessages[i].getter_nick,
        data.directMessages[i].sender_id,
        data.directMessages[i].sender_nick,
        data.directMessages[i].message,
      );
    }
  }

  addDirectMessageByDMHistory(
    getterId,
    getterNick,
    senderId,
    senderNick,
    message,
  ) {
    let otherPlayerMemberId = getterId;
    let nickName = '나';
    if (getterId == PlayerData.memberId) {
      otherPlayerMemberId = senderId;
      nickName = senderNick;
    }
    const item = document.createElement('div');
    item.innerHTML = `${nickName}<br>${message}`;
    item.style.color = 'white';

    this.directMessageRoomContainer[otherPlayerMemberId].chatBox.appendChild(
      item,
    );
    this.directMessageRoomContainer[otherPlayerMemberId].chatBox.scrollTop =
      this.directMessageRoomContainer[otherPlayerMemberId].chatBox.scrollHeight;
  }
  //DM히스토리를 통해 각 멤버에 대한 DirectMessageRoom을 만듭니다.
  createDirectMessageRoomByDMHistory(
    getterId,
    getterNick,
    senderId,
    senderNick,
  ) {
    let otherPlayerMemberId = getterId;
    let otherPlayerNickName = getterNick;
    window.console.log('otherPlayerMemberId before=>', otherPlayerMemberId);
    if (getterId == PlayerData.memberId) {
      otherPlayerMemberId = senderId;
      otherPlayerNickName = senderNick;
    }
    window.console.log('otherPlayerMemberId after=>', otherPlayerMemberId);

    if (this.directMessageRoomContainer[otherPlayerMemberId]) {
      return;
    }

    this.directMessageRoomContainer[otherPlayerMemberId] =
      document.createElement('div');
    this.directMessageRoomContainer[otherPlayerMemberId].classList.add(
      'directMessageRoom',
    );
    this.directMessageRoomContainer[otherPlayerMemberId].otherPlayerSocketId =
      undefined;
    this.directMessageRoomContainer[otherPlayerMemberId].style.width = '95%';
    this.directMessageRoomContainer[otherPlayerMemberId].style.height = '98%';
    this.directMessageRoomContainer[otherPlayerMemberId].style.alignItems =
      'center';
    this.directMessageRoomContainer[otherPlayerMemberId].style.justifyContent =
      'center';
    this.directMessageRoomContainer[otherPlayerMemberId].style.display = 'none';
    this.directMessageRoomContainer[otherPlayerMemberId].style.flexDirection =
      'column';
    this.directMessageRoomContainer[otherPlayerMemberId].style.padding = '5px';
    this.sidebar.appendChild(
      this.directMessageRoomContainer[otherPlayerMemberId],
    );

    this.directMessageRoomContainer[otherPlayerMemberId].chatBox =
      document.createElement('div');
    this.directMessageRoomContainer[otherPlayerMemberId].chatBox.style.height =
      '80vh';
    this.directMessageRoomContainer[otherPlayerMemberId].chatBox.style.width =
      '100%';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatBox.style.overflowY = 'auto';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatBox.style.transition = 'transform 0.3s ease-in-out';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatBox.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.1)';
    this.directMessageRoomContainer[otherPlayerMemberId].appendChild(
      this.directMessageRoomContainer[otherPlayerMemberId].chatBox,
    );

    this.directMessageRoomContainer[otherPlayerMemberId].chatInput =
      document.createElement('input');
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.style.border = '1px solid white';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.style.borderRadius = '5px';
    this.directMessageRoomContainer[otherPlayerMemberId].chatInput.style.width =
      '100%';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.style.backgroundColor = 'transparent';
    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.style.marginTop = '10px';
    this.directMessageRoomContainer[otherPlayerMemberId].chatInput.style.color =
      'white';

    this.directMessageRoomContainer[
      otherPlayerMemberId
    ].chatInput.addEventListener('keydown', (event) => {
      if (
        !this.scene.otherPlayers[
          this.directMessageRoomContainer[otherPlayerMemberId]
            .otherPlayerSocketId
        ]
      ) {
        const placeholderText = '미접속자에게 DM은 불가합니다.';
        event.preventDefault(); // 입력 방지
        this.directMessageRoomContainer[
          otherPlayerMemberId
        ].chatInput.disabled = true; // 입력 비활성화
        this.directMessageRoomContainer[otherPlayerMemberId].chatInput.value =
          '';
        this.directMessageRoomContainer[
          otherPlayerMemberId
        ].chatInput.placeholder = placeholderText;

        setTimeout(() => {
          this.directMessageRoomContainer[
            otherPlayerMemberId
          ].chatInput.disabled = false; // 입력 다시 활성화
          this.directMessageRoomContainer[
            otherPlayerMemberId
          ].chatInput.placeholder = '';
        }, 5000);
      }
      if (
        event.key === 'Enter' &&
        event.target.value &&
        this.scene.otherPlayers[
          this.directMessageRoomContainer[otherPlayerMemberId]
            .otherPlayerSocketId
        ]
      ) {
        const item = document.createElement('div');
        item.innerHTML = `나<br>${event.target.value}`;
        item.style.color = 'white';
        this.directMessageRoomContainer[
          otherPlayerMemberId
        ].chatBox.appendChild(item);
        this.directMessageRoomContainer[otherPlayerMemberId].chatBox.scrollTop =
          this.directMessageRoomContainer[
            otherPlayerMemberId
          ].chatBox.scrollHeight;
        console.log(
          'SocketManager.getInstance().sendDirectMessageToPlayer()',
          this.directMessageRoomContainer[otherPlayerMemberId]
            .otherPlayerSocketId,
          PlayerData.nickName,
          otherPlayerNickName,
          event.target.value,
        );
        SocketManager.getInstance().sendDirectMessageToPlayer(
          this.directMessageRoomContainer[otherPlayerMemberId]
            .otherPlayerSocketId,
          PlayerData.nickName,
          otherPlayerNickName,
          event.target.value,
        );
        event.target.value = '';
      }
    });
    this.directMessageRoomContainer[otherPlayerMemberId].appendChild(
      this.directMessageRoomContainer[otherPlayerMemberId].chatInput,
    );
  }
  /////////////////////////////////////////////////////////////////////////////
  async eventscallback(namespace, data) {
    window.console.log('eventscallback in sidebar=>', namespace);
    switch (namespace) {
      case 'updateSpaceUsers':
        // 유저 목록 조회
        // data.forEach((playerdata) => {

        // });
        break;
      case 'spaceUsers':
        if (!this.isGettingAllChat) {
          //전채채팅 가져오는 로직
          SocketManager.getInstance().requestAllChat(PlayerData.spaceId);
          this.isGettingAllChat = true;
        }
        if (!this.isGettingAllDM) {
          SocketManager.getInstance().requestAllDM(PlayerData.memberId);
          this.isGettingAllDM = true;
          if (!this.isMockingOtherPlayers) {
            //모킹 로직
            await this.mockingOtherPlayers();
            this.isMockingOtherPlayers = true;
          }
        }
        console.log('spaceUsers eventcallback:', data);
        for (let i = 0; i < data.length; i++) {
          // console.log("this.directMessageRoomContainer[data[i].memberId]:", this.directMessageRoomContainer[data[i].memberId], data[i].id)
          if (this.directMessageRoomContainer[data[i].memberId]) {
            this.directMessageRoomContainer[
              data[i].memberId
            ].otherPlayerSocketId = data[i].id;
          }
        }
        break;
      case 'joinSpacePlayer':
        if (this.directMessageRoomContainer[data.memberId]) {
          console.log('eventscallback joinSpacePlayer =>', data);
          this.directMessageRoomContainer[data.memberId].otherPlayerSocketId =
            data.id;
        }
        break;
      case 'directMessage':
        //함수부터 만들어야지
        // data.senderId,
        // message: data.message,
        window.console.log('directMessage=>', data);
        this.directMessage(data.senderId, data.message);
        break;
      case 'chatPlayer':
        this.chatMessage(data.nickName, data.message);
        break;
      case 'chatInGroup':
        console.log('chatInGrout:', data);
        this.chatInGroup(data.senderNickName, data.message);
        break;
      case 'AllChatHistory':
        this.addAllChatHistory(data);
        break;
      case 'AllDMHistory':
        console.log('addALLDMHistory');
        this.addAllDMHistory(data);
        break;
    }
  }
}
