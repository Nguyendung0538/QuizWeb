document.addEventListener('DOMContentLoaded', () => {
  // Check if users exist in localStorage, if not initialize with empty array
  if (!localStorage.getItem('quiz_users')) {
    localStorage.setItem('quiz_users', JSON.stringify([]));
  }

  const registerForm = document.getElementById('registerForm');
  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const confirmPasswordInput = document.getElementById('confirmPasswordInput');

  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmError = document.getElementById('confirmError');

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      // Clear errors
      [nameError, emailError, passwordError, confirmError].forEach(el => el.classList.add('hidden'));
      [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(el => {
        el.classList.remove('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
      });
      emailError.textContent = 'Vui lòng nhập email hợp lệ';

      if (!name) {
        nameError.classList.remove('hidden');
        nameInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
        isValid = false;
      }

      if (!email) {
        emailError.classList.remove('hidden');
        emailInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
        isValid = false;
      }

      if (!password || password.length < 6) {
        passwordError.classList.remove('hidden');
        passwordInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
        isValid = false;
      }

      if (password !== confirmPassword || !confirmPassword) {
        confirmError.classList.remove('hidden');
        confirmPasswordInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
        isValid = false;
      }

      if (isValid) {
        const users = JSON.parse(localStorage.getItem('quiz_users')) || [];
        // Check if email already exists
        const userExists = users.some(u => u.email === email);

        if (userExists) {
          emailError.textContent = 'Email này đã được đăng ký!';
          emailError.classList.remove('hidden');
          emailInput.classList.add('border-red-500', 'focus:ring-red-500/20', 'focus:border-red-500');
        } else {
          // Create new user with incremental ID
          const newUser = {
            id: users.length + 1,
            username: email, // use email as username for login
            email: email,
            password: password,
            name: name,
            role: 'student'
          };

          users.push(newUser);
          localStorage.setItem('quiz_users', JSON.stringify(users));

          alert('Đăng ký tài khoản thành công! Lần tới bạn có thể sử dụng email để đăng nhập.');
          window.location.href = 'login.html';
        }
      }
    });
  }
});
