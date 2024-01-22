import { requestLogin } from '../utils/request';

/**
 * scene의 로그인 모달 생성 함수
 * @param {Phaser.Scene} scene
 */
export default class LoginModal {
  constructor() {
    this.loginModal = document.createElement('div');
    this.loginModal.classList.add('modal');
    document.body.appendChild(this.loginModal);

    const modalHeader = document.createElement('div');
    modalHeader.classList.add('modal-header');
    modalHeader.innerText = 'LOGIN';
    this.loginModal.appendChild(modalHeader);

    const modalContent = document.createElement('div');
    this.loginModal.appendChild(modalContent);

    // Create the close button span
    const closeButton = document.createElement('span');
    closeButton.classList.add('modal-close');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = this.closeModal.bind(this);
    modalContent.appendChild(closeButton);

    const emailGroup = document.createElement('div');
    emailGroup.classList.add('group');
    modalContent.appendChild(emailGroup);

    const emailLabel = document.createElement('label');
    emailLabel.textContent = 'Email';
    emailGroup.appendChild(emailLabel);

    this.emailInput = document.createElement('input');
    this.emailInput.type = 'text';
    this.emailInput.id = 'login-email';
    emailGroup.appendChild(this.emailInput);

    const passwordGroup = document.createElement('div');
    passwordGroup.classList.add('group');
    modalContent.appendChild(passwordGroup);

    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Password:';
    passwordGroup.appendChild(passwordLabel);

    this.passwordInput = document.createElement('input');
    this.passwordInput.id = 'login-password';
    this.passwordInput.type = 'password';
    passwordGroup.appendChild(this.passwordInput);

    // Create the login button
    const loginButton = document.createElement('button');
    loginButton.textContent = 'Login';
    loginButton.onclick = this.reqLogin.bind(this);
    loginButton.style.width = '100%';
    modalContent.appendChild(loginButton);

    // const self = this;
    // // Phaser Scene에서 버튼 클릭 시 모달 열기
    // scene.input.on('pointerdown', function (pointer) {
    //   self.openModal();
    // });
  }

  setLoginFunction(successLoginFunc) {
    this.successLogin = successLoginFunc;
  }

  openModal() {
    this.loginModal.style.display = 'block';
  }

  closeModal() {
    this.loginModal.style.display = 'none';
  }

  reqLogin() {
    // 로그인 처리 로직을 추가할 수 있음
    console.log('Logging in...');
    requestLogin(
      {
        email: this.emailInput.value,
        password: this.passwordInput.value,
      },
      this.successLogin.bind(this),
    );
  }

  destroy() {
    this.loginModal.innerHTML = '';
    document.body.removeChild(this.loginModal);
  }
}