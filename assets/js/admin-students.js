document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Mock Data if not exists
  if (!localStorage.getItem('quiz_users')) {
    const initialUsers = [
      { id: Date.now() + 1, name: 'Nguyễn Văn A', email: 'nva.b20dccn001@stu.ptit.edu.vn', password: 'password', role: 'student', status: 'active' },
      { id: Date.now() + 2, name: 'Trần Thị B', email: 'ttb.b20dccn002@stu.ptit.edu.vn', password: 'password', role: 'student', status: 'active' },
      { id: Date.now() + 3, name: 'Lê Văn C', email: 'lvc.b20dccn045@stu.ptit.edu.vn', password: 'password', role: 'student', status: 'locked' }
    ];
    // generating some extra mock data for pagination
    for (let i = 4; i <= 25; i++) {
      initialUsers.push({ id: Date.now() + i, name: `Sinh viên ${i}`, email: `sv${i}@stu.ptit.edu.vn`, password: 'password', role: 'student', status: i % 5 === 0 ? 'locked' : 'active' });
    }
    localStorage.setItem('quiz_users', JSON.stringify(initialUsers));
  }

  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; renderStudents(); });
  if (statusFilter) statusFilter.addEventListener('change', () => { currentPage = 1; renderStudents(); });

  // Modal elements
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const studentModal = document.getElementById('studentModal');
  const studentModalOverlay = document.getElementById('studentModalOverlay');
  const studentModalContent = document.getElementById('studentModalContent');
  const studentForm = document.getElementById('studentForm');

  const deleteModal = document.getElementById('deleteModal');
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteModalContent = document.getElementById('deleteModalContent');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // Multi-delete Modal Elements
  const deleteMultipleStudentModal = document.getElementById('deleteMultipleStudentModal');
  const deleteMultipleStudentModalOverlay = document.getElementById('deleteMultipleStudentModalOverlay');
  const deleteMultipleStudentModalContent = document.getElementById('deleteMultipleStudentModalContent');
  const confirmDeleteMultipleStudentBtn = document.getElementById('confirmDeleteMultipleStudentBtn');
  const multiDeleteStudentBtn = document.getElementById('multiDeleteStudentBtn');
  const selectAllStudents = document.getElementById('selectAllStudents');

  if (selectAllStudents) {
    selectAllStudents.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const checkboxes = document.querySelectorAll('.student-checkbox');
      checkboxes.forEach(cb => {
        cb.checked = isChecked;
      });
      updateSelectedStudentCount();
    });
  }

  if (multiDeleteStudentBtn) {
    multiDeleteStudentBtn.addEventListener('click', () => {
      const selectedBoxes = document.querySelectorAll('.student-checkbox:checked');
      if (selectedBoxes.length === 0) return;

      document.getElementById('deleteMultipleStudentCount').textContent = selectedBoxes.length;
      openModal(deleteMultipleStudentModal, deleteMultipleStudentModalOverlay, deleteMultipleStudentModalContent);
    });
  }

  const multiLockStudentBtn = document.getElementById('multiLockStudentBtn');
  const multiUnlockStudentBtn = document.getElementById('multiUnlockStudentBtn');

  if (multiLockStudentBtn) {
    multiLockStudentBtn.addEventListener('click', () => {
      bulkChangeStatus('locked');
    });
  }

  if (multiUnlockStudentBtn) {
    multiUnlockStudentBtn.addEventListener('click', () => {
      bulkChangeStatus('active');
    });
  }

  function bulkChangeStatus(newStatus) {
    const selectedBoxes = document.querySelectorAll('.student-checkbox:checked');
    if (selectedBoxes.length === 0) return;

    const emailsTarget = Array.from(selectedBoxes).map(cb => cb.dataset.email);
    let users = JSON.parse(localStorage.getItem('quiz_users')) || [];

    users = users.map(u => {
      if (emailsTarget.includes(u.email)) {
        return { ...u, status: newStatus };
      }
      return u;
    });

    localStorage.setItem('quiz_users', JSON.stringify(users));
    renderStudents();

    // Khôi phục lại trạng thái checked cho các tài khoản vừa thao tác
    const newBoxes = document.querySelectorAll('.student-checkbox');
    newBoxes.forEach(cb => {
      if (emailsTarget.includes(cb.dataset.email)) {
        cb.checked = true;
      }
    });
    if (window.handleStudentSelection) window.handleStudentSelection();
  }

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeStudentModal();
    });
  });

  document.querySelectorAll('.reset-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.closeResetPasswordModal) window.closeResetPasswordModal();
    });
  });
  document.querySelectorAll('.delete-close').forEach(btn => {
    btn.addEventListener('click', closeDeleteModal);
  });
  document.querySelectorAll('.delete-multiple-student-close').forEach(btn => {
    btn.addEventListener('click', closeMultiDeleteStudentModal);
  });

  // Open add modal
  if (openAddModalBtn) {
    openAddModalBtn.addEventListener('click', () => {
      document.getElementById('modalTitle').textContent = 'Thêm học viên mới';
      document.getElementById('studentId').value = '';
      document.getElementById('studentName').value = '';
      document.getElementById('studentEmail').value = '';
      document.getElementById('studentEmail').disabled = false;

      const resetBtn = document.getElementById('resetPasswordBtnInModal');
      if (resetBtn) {
        resetBtn.classList.add('hidden');
      }

      openModal(studentModal, studentModalOverlay, studentModalContent);
    });
  }

  // Handle form submit
  if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('studentId').value;
      const name = document.getElementById('studentName').value.trim();
      const email = document.getElementById('studentEmail').value.trim();

      let users = JSON.parse(localStorage.getItem('quiz_users')) || [];

      if (id) {
        // Update
        const index = users.findIndex(u => u.id == id);
        if (index > -1) {
          users[index].name = name;
          // Note: typically email shouldn't be changed or checked for duplication, but for mock:
          users[index].email = email;
        }
      } else {
        // Create
        if (users.some(u => u.email === email)) {
          alert('Email này đã tồn tại trong hệ thống!');
          return;
        }
        users.unshift({
          id: Date.now(),
          name: name,
          email: email,
          password: 'password', // 123456 as requested in mock
          role: 'student',
          status: 'active'
        });
      }

      localStorage.setItem('quiz_users', JSON.stringify(users));
      closeStudentModal();
      renderStudents();
    });
  }

  // Handle confirm delete
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      const email = confirmDeleteBtn.dataset.email;
      if (email) {
        let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
        users = users.filter(u => u.email !== email);
        localStorage.setItem('quiz_users', JSON.stringify(users));
        closeDeleteModal();
        renderStudents();
      }
    });
  }

  if (confirmDeleteMultipleStudentBtn) {
    confirmDeleteMultipleStudentBtn.addEventListener('click', () => {
      const selectedBoxes = document.querySelectorAll('.student-checkbox:checked');
      const emailsToDelete = Array.from(selectedBoxes).map(cb => cb.dataset.email);

      let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
      users = users.filter(u => !emailsToDelete.includes(u.email));
      localStorage.setItem('quiz_users', JSON.stringify(users));

      closeMultiDeleteStudentModal();
      if (selectAllStudents) selectAllStudents.checked = false;
      renderStudents();
    });
  }

  // Helper bindings for global scope (onclick in HTML)
  window.openEditStudentModal = function (id) {
    const users = JSON.parse(localStorage.getItem('quiz_users')) || [];
    const student = users.find(u => u.id == id);
    if (student) {
      document.getElementById('modalTitle').textContent = 'Chỉnh sửa thông tin học viên';
      document.getElementById('studentId').value = student.id;
      document.getElementById('studentName').value = student.name;
      document.getElementById('studentEmail').value = student.email;
      document.getElementById('studentEmail').disabled = true; // prevent changing email

      const resetBtn = document.getElementById('resetPasswordBtnInModal');
      if (resetBtn) {
        resetBtn.classList.remove('hidden');
        resetBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          confirmResetPassword(student.id);
        };
      }

      openModal(studentModal, studentModalOverlay, studentModalContent);
    }
  };

  window.openDeleteStudentModal = function (email) {
    document.getElementById('deleteTargetEmail').textContent = email;
    confirmDeleteBtn.dataset.email = email;
    openModal(deleteModal, deleteModalOverlay, deleteModalContent);
  };

  // Handle Reset Password Logic
  const resetPasswordModal = document.getElementById('resetPasswordModal');
  const resetPasswordModalOverlay = document.getElementById('resetPasswordModalOverlay');
  const resetPasswordModalContent = document.getElementById('resetPasswordModalContent');
  const confirmResetPasswordBtn = document.getElementById('confirmResetPasswordBtn');
  let studentToResetId = null;

  window.confirmResetPassword = function (id) {
    studentToResetId = id;
    let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
    const user = users.find(u => u.id == id);
    if (!user) return;

    document.getElementById('resetStudentName').textContent = user.name || user.username;

    // Explicitly handle z-index and pointer events for this specific modal
    resetPasswordModalOverlay.classList.remove('pointer-events-none');

    openModal(resetPasswordModal, resetPasswordModalOverlay, resetPasswordModalContent);
  }

  window.closeResetPasswordModal = function () {
    closeModal(resetPasswordModal, resetPasswordModalOverlay, resetPasswordModalContent);
    setTimeout(() => {
      resetPasswordModalOverlay.classList.add('pointer-events-none');
    }, 300);
    studentToResetId = null;
  }

  if (confirmResetPasswordBtn) {
    confirmResetPasswordBtn.addEventListener('click', () => {
      if (!studentToResetId) return;
      let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
      const index = users.findIndex(u => u.id == studentToResetId);

      if (index !== -1) {
        users[index].password = '123456';
        localStorage.setItem('quiz_users', JSON.stringify(users));
        alert('Khôi phục mật khẩu thành công! Mật khẩu mới là: 123456');
      }
      closeResetPasswordModal();
    });
  }

  // Initial render
  // Add slight delay in case components need to load
  setTimeout(renderStudents, 50);
});

let currentPage = 1;
const itemsPerPage = 6;

function openModal(modal, overlay, content) {
  modal.classList.remove('hidden');
  // Trigger reflow
  void modal.offsetWidth;
  overlay.classList.remove('opacity-0');
  content.classList.remove('opacity-0', 'scale-95');
  content.classList.add('scale-100');
}

function closeModal(modal, overlay, content) {
  overlay.classList.add('opacity-0');
  content.classList.remove('scale-100');
  content.classList.add('opacity-0', 'scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

function closeStudentModal() {
  const modal = document.getElementById('studentModal');
  const overlay = document.getElementById('studentModalOverlay');
  const content = document.getElementById('studentModalContent');
  if (modal) closeModal(modal, overlay, content);
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  const overlay = document.getElementById('deleteModalOverlay');
  const content = document.getElementById('deleteModalContent');
  if (modal) closeModal(modal, overlay, content);
}

function closeMultiDeleteStudentModal() {
  const modal = document.getElementById('deleteMultipleStudentModal');
  const overlay = document.getElementById('deleteMultipleStudentModalOverlay');
  const content = document.getElementById('deleteMultipleStudentModalContent');
  if (modal) closeModal(modal, overlay, content);
}

window.handleStudentSelection = function () {
  const checkboxes = document.querySelectorAll('.student-checkbox');
  const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
  const selectAll = document.getElementById('selectAllStudents');
  if (selectAll) {
    selectAll.checked = allChecked;
  }
  updateSelectedStudentCount();
};

function updateSelectedStudentCount() {
  const count = document.querySelectorAll('.student-checkbox:checked').length;
  const countEl = document.getElementById('selectedStudentCount');
  const multiDeleteBtn = document.getElementById('multiDeleteStudentBtn');
  const bulkStatusActions = document.getElementById('bulkStatusActions');

  if (countEl) countEl.textContent = count;
  if (count > 0) {
    if (multiDeleteBtn) {
      multiDeleteBtn.classList.remove('hidden');
      multiDeleteBtn.classList.add('flex');
    }
    if (bulkStatusActions) {
      bulkStatusActions.classList.remove('hidden');
      bulkStatusActions.classList.add('flex');
    }
  } else {
    if (multiDeleteBtn) {
      multiDeleteBtn.classList.add('hidden');
      multiDeleteBtn.classList.remove('flex');
    }
    if (bulkStatusActions) {
      bulkStatusActions.classList.add('hidden');
      bulkStatusActions.classList.remove('flex');
    }
  }
}

function getAvatarPlaceholder(name) {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  const colors = [
    'bg-primary/10 text-primary',
    'bg-blue-100 text-blue-600',
    'bg-amber-100 text-amber-600',
    'bg-emerald-100 text-emerald-600',
    'bg-purple-100 text-purple-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = colors[Math.abs(hash) % colors.length];

  return `
        <div class="size-8 rounded-full ${colorClass} flex items-center justify-center font-bold text-xs uppercase shrink-0">
            ${initial}
        </div>
    `;
}

function getStatusBadge(status) {
  if (status === 'active') {
    return `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">
                <span class="size-1.5 rounded-full bg-emerald-500"></span>
                Hoạt động
            </span>
        `;
  }
  return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 drop-shadow-sm">
            <span class="size-1.5 rounded-full bg-slate-400"></span>
            Bị khóa
        </span>
    `;
}

function renderStudents() {
  const studentsTableBody = document.getElementById('studentsTableBody');
  if (!studentsTableBody) return;

  let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
  let students = users.filter(u => u.role !== 'admin' && (u.username !== 'admin'));

  students.forEach((s, index) => {
    if (!s.status) s.status = 'active';
    if (!s.id) s.id = Date.now() + index; // Ensure ID exists for editing
  });

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const lockedStudents = students.filter(s => s.status === 'locked').length;

  const totalCountEl = document.getElementById('totalStudentsCount');
  const activeCountEl = document.getElementById('activeStudentsCount');
  const lockedCountEl = document.getElementById('lockedStudentsCount');

  if (totalCountEl) totalCountEl.textContent = totalStudents;
  if (activeCountEl) activeCountEl.textContent = activeStudents;
  if (lockedCountEl) lockedCountEl.textContent = lockedStudents;

  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const statusVal = document.getElementById('statusFilter')?.value || 'all';

  let filtered = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery) || s.email?.toLowerCase().includes(searchQuery) || s.username?.toLowerCase().includes(searchQuery);
    let matchesStatus = true;
    if (statusVal === 'active') matchesStatus = s.status === 'active';
    if (statusVal === 'locked') matchesStatus = s.status === 'locked';
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);

  // Render Pagination HTML
  const paginationContainer = document.querySelector('.p-4.border-t.border-slate-200 > div.flex.items-center.gap-1');
  if (paginationContainer) {
    let pageHtml = '';

    // Prev Button
    pageHtml += `<button onclick="goToPage(${currentPage - 1})" class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg ${currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:border-primary hover:text-primary transition-colors'}">Trước</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        if (i === currentPage) {
          pageHtml += `<button class="w-8 h-8 flex items-center justify-center text-sm font-medium border border-primary bg-primary/10 text-primary rounded-lg">${i}</button>`;
        } else {
          pageHtml += `<button onclick="goToPage(${i})" class="w-8 h-8 flex items-center justify-center text-sm font-medium border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors rounded-lg">${i}</button>`;
        }
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        if (pageHtml.includes('<!-- last ... break -->')) continue;
        pageHtml += `<span class="px-2 text-slate-400">...</span>`;
      }
    }

    // Next Button
    pageHtml += `<button onclick="goToPage(${currentPage + 1})" class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg ${currentPage === totalPages || totalPages === 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:border-primary hover:text-primary transition-colors'}">Tiếp</button>`;

    paginationContainer.innerHTML = pageHtml;
  }

  const paginationInfo = document.getElementById('paginationInfo');
  if (paginationInfo) {
    const showingStart = filtered.length === 0 ? 0 : startIndex + 1;
    const showingEnd = Math.min(endIndex, filtered.length);
    paginationInfo.innerHTML = `Đang hiển thị <span class="font-medium text-slate-900">${showingStart}-${showingEnd}</span> trong số <span class="font-medium text-slate-900">${filtered.length}</span> học viên`;
  }

  if (paginated.length === 0) {
    studentsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy học viên nào.
                </td>
            </tr>
        `;
    return;
  }

  let html = '';
  paginated.forEach(student => {
    const isLocked = student.status === 'locked';
    const rowBg = isLocked ? 'bg-red-50/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50';
    const nameColor = isLocked ? 'text-slate-500' : '';
    const emailColor = isLocked ? 'text-slate-400' : 'text-slate-500';

    const actionButtons = isLocked ? `
            <button onclick="toggleStudentStatus('${student.email}')" class="p-1.5 text-slate-400 hover:text-emerald-500 rounded transition-colors" title="Mở khóa">
                <span class="material-symbols-outlined text-[20px]">lock_open</span>
            </button>
            <button onclick="openDeleteStudentModal('${student.email}')" class="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors" title="Xóa vĩnh viễn">
                <span class="material-symbols-outlined text-[20px]">delete_forever</span>
            </button>
        ` : `
            <a href="admin-student-results.html?email=${encodeURIComponent(student.email)}" class="p-1.5 text-slate-400 hover:text-primary rounded transition-colors inline-block" title="Xem chi tiết điểm">
                <span class="material-symbols-outlined text-[20px]">analytics</span>
            </a>
            <button onclick="openEditStudentModal('${student.id}')" class="p-1.5 text-slate-400 hover:text-blue-500 rounded transition-colors" title="Chỉnh sửa">
                <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button onclick="toggleStudentStatus('${student.email}')" class="p-1.5 text-slate-400 hover:text-amber-500 rounded transition-colors" title="Khóa tài khoản">
                <span class="material-symbols-outlined text-[20px]">lock</span>
            </button>
            <button onclick="openDeleteStudentModal('${student.email}')" class="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors" title="Xóa vĩnh viễn">
                <span class="material-symbols-outlined text-[20px]">delete_forever</span>
            </button>
        `;

    html += `
            <tr class="transition-colors ${rowBg}">
                <td class="px-6 py-4">
                    <input type="checkbox" data-email="${student.email}" onclick="handleStudentSelection()" class="student-checkbox rounded border-slate-300 text-primary focus:ring-primary">
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${getAvatarPlaceholder(student.name || student.username)}
                        <span class="font-medium text-sm ${nameColor} truncate w-40 block">${student.name || student.username || 'Chưa cập nhật'}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm ${emailColor} truncate w-48 block">${student.email || 'Chưa cập nhật'}</div>
                </td>
                <td class="px-6 py-4">
                    ${getStatusBadge(student.status)}
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
  });

  studentsTableBody.innerHTML = html;
}

window.goToPage = function (page) {
  const users = JSON.parse(localStorage.getItem('quiz_users')) || [];
  const students = users.filter(u => u.role !== 'admin' && (u.username !== 'admin'));
  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const statusVal = document.getElementById('statusFilter')?.value || 'all';
  const filtered = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery) || s.email?.toLowerCase().includes(searchQuery) || s.username?.toLowerCase().includes(searchQuery);
    let matchesStatus = true;
    if (statusVal === 'active') matchesStatus = s.status === 'active';
    if (statusVal === 'locked') matchesStatus = s.status === 'locked';
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderStudents();
  }
};

window.toggleStudentStatus = function (email) {
  let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
  const index = users.findIndex(u => u.email === email);
  if (index > -1) {
    users[index].status = users[index].status === 'locked' ? 'active' : 'locked';
    localStorage.setItem('quiz_users', JSON.stringify(users));
    renderStudents();
  }
};
