document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Mock Data if not exists
  if (!localStorage.getItem('quiz_users')) {
    const initialUsers = [
      { id: 1, name: 'Nguyễn Văn A', email: 'nva.b20dccn001@stu.ptit.edu.vn', password: 'password', role: 'student', status: 'active' },
      { id: 2, name: 'Trần Thị B', email: 'ttb.b20dccn002@stu.ptit.edu.vn', password: 'password', role: 'student', status: 'active' },
      { id: 3, name: 'Lê Văn C', email: 'lvc.b20dccn045@stu.ptit.edu.vn', password: 'password', role: 'student', status: 'locked' }
    ];
    localStorage.setItem('quiz_users', JSON.stringify(initialUsers));
  }

  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) searchInput.addEventListener('input', renderStudents);
  if (statusFilter) statusFilter.addEventListener('change', renderStudents);

  // Initial render
  renderStudents();
});

function getAvatarPlaceholder(name) {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  const colors = [
    'bg-primary/10 text-primary',
    'bg-blue-100 text-blue-600',
    'bg-amber-100 text-amber-600',
    'bg-emerald-100 text-emerald-600',
    'bg-purple-100 text-purple-600'
  ];
  // Simple hash to consistently assign color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = colors[Math.abs(hash) % colors.length];

  return `
        <div class="size-8 rounded-full ${colorClass} flex items-center justify-center font-bold text-xs uppercase">
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
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <span class="size-1.5 rounded-full bg-slate-400"></span>
            Bị khóa
        </span>
    `;
}

function renderStudents() {
  const studentsTableBody = document.getElementById('studentsTableBody');
  if (!studentsTableBody) return;

  let users = JSON.parse(localStorage.getItem('quiz_users')) || [];

  // Filter out potential non-student accounts (we assume all default are students unless role=admin)
  let students = users.filter(u => u.role !== 'admin' && (u.username !== 'admin'));

  // Handle standard users from earlier iterations that might not have a 'status'
  students.forEach(s => {
    if (!s.status) s.status = 'active'; // Default to active
  });

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const lockedStudents = students.filter(s => s.status === 'locked').length;

  // Update Counters
  const totalCountEl = document.getElementById('totalStudentsCount');
  const activeCountEl = document.getElementById('activeStudentsCount');
  const lockedCountEl = document.getElementById('lockedStudentsCount');

  if (totalCountEl) totalCountEl.textContent = totalStudents;
  if (activeCountEl) activeCountEl.textContent = activeStudents;
  if (lockedCountEl) lockedCountEl.textContent = lockedStudents;

  // Apply Search & Filter
  const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const statusVal = document.getElementById('statusFilter')?.value || 'all';

  let filtered = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery) || s.email?.toLowerCase().includes(searchQuery) || s.username?.toLowerCase().includes(searchQuery);

    let matchesStatus = true;
    if (statusVal === 'active') matchesStatus = s.status === 'active';
    if (statusVal === 'locked') matchesStatus = s.status === 'locked';

    return matchesSearch && matchesStatus;
  });

  // Update Pagination Info Mock
  const paginationInfo = document.getElementById('paginationInfo');
  if (paginationInfo) {
    paginationInfo.innerHTML = `Đang hiển thị <span class="font-medium text-slate-900">1-${filtered.length}</span> trong số <span class="font-medium text-slate-900">${totalStudents}</span> học viên`;
  }

  if (filtered.length === 0) {
    studentsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy học viên nào phù hợp.
                </td>
            </tr>
        `;
    return;
  }

  let html = '';
  filtered.forEach(student => {
    const isLocked = student.status === 'locked';
    const rowBg = isLocked ? 'bg-red-50/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50';
    const nameColor = isLocked ? 'text-slate-500' : '';
    const emailColor = isLocked ? 'text-slate-400' : 'text-slate-500';

    const actionButtons = isLocked ? `
            <button onclick="toggleStudentStatus('${student.email}')" class="p-1.5 text-slate-400 hover:text-emerald-500 rounded transition-colors" title="Mở khóa">
                <span class="material-symbols-outlined text-[20px]">lock_open</span>
            </button>
            <button onclick="deleteStudent('${student.email}')" class="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors" title="Xóa vĩnh viễn">
                <span class="material-symbols-outlined text-[20px]">delete_forever</span>
            </button>
        ` : `
            <button class="p-1.5 text-slate-400 hover:text-primary rounded transition-colors" title="Xem chi tiết điểm">
                <span class="material-symbols-outlined text-[20px]">analytics</span>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-blue-500 rounded transition-colors" title="Chỉnh sửa">
                <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button onclick="toggleStudentStatus('${student.email}')" class="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors" title="Khóa tài khoản">
                <span class="material-symbols-outlined text-[20px]">lock</span>
            </button>
        `;

    html += `
            <tr class="transition-colors ${rowBg}">
                <td class="px-6 py-4">
                    <input type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary">
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${getAvatarPlaceholder(student.name || student.username)}
                        <span class="font-medium text-sm ${nameColor}">${student.name || student.username || 'Chưa cập nhật'}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm ${emailColor}">${student.email || 'Chưa cập nhật'}</div>
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

window.toggleStudentStatus = function (email) {
  let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
  const index = users.findIndex(u => u.email === email);
  if (index > -1) {
    users[index].status = users[index].status === 'locked' ? 'active' : 'locked';
    localStorage.setItem('quiz_users', JSON.stringify(users));
    renderStudents();
  }
};

window.deleteStudent = function (email) {
  if (confirm('Bạn có chắc chắn muốn xóa học viên này vĩnh viễn? Hành động này không thể hoàn tác.')) {
    let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
    users = users.filter(u => u.email !== email);
    localStorage.setItem('quiz_users', JSON.stringify(users));
    renderStudents();
  }
};
