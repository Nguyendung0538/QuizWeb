document.addEventListener('DOMContentLoaded', () => {
  // Check if users array exist in localStorage, if not initialize with empty array
  if (!localStorage.getItem('quiz_users')) {
    localStorage.setItem('quiz_users', JSON.stringify([]));
  }

  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  // Toggle Password Visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePasswordBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">${type === 'password' ? 'visibility' : 'visibility_off'}</span>`;
    });
  }

  // --- Forgot Password Modal Logic ---
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotPasswordModal = document.getElementById('forgotPasswordModal');
  const forgotPasswordOverlay = document.getElementById('forgotPasswordOverlay');
  const forgotPasswordContent = document.getElementById('forgotPasswordContent');
  const closeForgotBtn = document.getElementById('closeForgotBtn');

  function openForgotModal() {
    forgotPasswordModal.classList.remove('hidden');
    forgotPasswordModal.classList.add('flex');
    // Trigger animation
    setTimeout(() => {
      forgotPasswordOverlay.classList.remove('opacity-0');
      forgotPasswordContent.classList.remove('opacity-0', 'scale-95');
      forgotPasswordContent.classList.add('opacity-100', 'scale-100');
    }, 10);
  }

  function closeForgotModal() {
    forgotPasswordOverlay.classList.add('opacity-0');
    forgotPasswordContent.classList.add('opacity-0', 'scale-95');
    forgotPasswordContent.classList.remove('opacity-100', 'scale-100');
    // Hide after animation completes
    setTimeout(() => {
      forgotPasswordModal.classList.add('hidden');
      forgotPasswordModal.classList.remove('flex');
    }, 300);
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      openForgotModal();
    });
  }

  if (closeForgotBtn) closeForgotBtn.addEventListener('click', closeForgotModal);
  if (forgotPasswordOverlay) forgotPasswordOverlay.addEventListener('click', closeForgotModal);
  // ------------------------------------

  // Logic Submittion & Validation
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      // Clear previous errors
      usernameError.classList.add('hidden');
      passwordError.classList.add('hidden');
      usernameError.textContent = 'Vui lòng nhập tên đăng nhập';
      passwordError.textContent = 'Vui lòng nhập mật khẩu';
      usernameInput.classList.remove('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
      passwordInput.classList.remove('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');

      if (!username) {
        usernameError.classList.remove('hidden');
        usernameInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
        isValid = false;
      }

      if (!password) {
        passwordError.classList.remove('hidden');
        passwordInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
        isValid = false;
      }

      if (isValid) {
        // Redirect to Admin Dashboard if username AND password are 'admin'
        if (username === 'admin' && password === 'admin') {
          localStorage.setItem('quiz_current_user', JSON.stringify({ role: 'admin', username: 'admin', name: 'Administrator' }));
          window.location.href = 'admin-dashboard.html';
        } else {
          // Check local storage for student
          const users = JSON.parse(localStorage.getItem('quiz_users')) || [];
          const user = users.find(u => (u.username === username || u.email === username) && u.password === password);

          if (user) {
            // User found
            localStorage.setItem('quiz_current_user', JSON.stringify(user));
            window.location.href = 'student-dashboard.html';
          } else {
            // Invalid credentials
            usernameError.textContent = 'Tài khoản hoặc mật khẩu không chính xác';
            usernameError.classList.remove('hidden');
            passwordError.textContent = 'Tài khoản hoặc mật khẩu không chính xác';
            passwordError.classList.remove('hidden');
            usernameInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
            passwordInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
          }
        }
      }
    });
  }
});
