document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Mock Data if not exists
  if (!localStorage.getItem('quiz_exams')) {
    const initialExams = [
      {
        id: 'MAT101',
        title: 'Giải tích 1',
        type: 'cuoi-ky',
        status: 'active',
        questionsCount: 50
      },
      {
        id: 'CSE202',
        title: 'Lập trình C++',
        type: 'giua-ky',
        status: 'active',
        questionsCount: 40
      },
      {
        id: 'NET301',
        title: 'Mạng máy tính',
        type: 'luyen-tap',
        status: 'closed',
        questionsCount: 30
      }
    ];
    localStorage.setItem('quiz_exams', JSON.stringify(initialExams));
  }

  const searchInput = document.getElementById('searchExamInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentPage = 1; // Reset to page 1 on search
      renderExams();
    });
  }

  renderExams();
});

function getStatusBadge(status) {
  if (status === 'active') {
    return `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span class="size-1.5 rounded-full bg-emerald-500"></span>
                Đang mở
            </span>
        `;
  }
  if (status === 'upcoming') {
    return `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <span class="size-1.5 rounded-full bg-amber-500"></span>
                Sắp diễn ra
            </span>
        `;
  }
  return `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <span class="size-1.5 rounded-full bg-slate-400"></span>
            Đã đóng
        </span>
    `;
}

function getTypeLabel(type) {
  const types = {
    'giua-ky': 'Giữa kỳ',
    'cuoi-ky': 'Cuối kỳ',
    'luyen-tap': 'Luyện Tập'
  };
  return types[type] || 'Khác';
}

let currentPage = 1;
const ITEMS_PER_PAGE = 10;

function renderExams() {
  const examsTableBody = document.getElementById('examsTableBody');
  if (!examsTableBody) return;

  let exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];

  const searchInput = document.getElementById('searchExamInput');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const now = new Date();
  let needsSync = false;
  exams.forEach(exam => {
    if (exam.isPermanent === false) {
      const startDate = new Date(exam.startTime);
      const endDate = new Date(exam.endTime);
      const diffMs = startDate - now;
      let newStatus = 'active';

      if (!exam.startTime || !exam.endTime) {
        newStatus = 'closed';
      } else if (now > endDate) {
        newStatus = 'closed';
      } else if (now < startDate) {
        if (diffMs > 0 && diffMs <= 60 * 60 * 1000) {
          newStatus = 'upcoming';
        } else {
          newStatus = 'closed';
        }
      }

      if (exam.status !== newStatus) {
        exam.status = newStatus;
        needsSync = true;
      }
    }
  });

  if (needsSync) {
    localStorage.setItem('quiz_exams', JSON.stringify(exams));
  }

  // Calculate statistics
  const activeExamsCount = exams.filter(e => e.status === 'active').length;
  const upcomingExamsCount = exams.filter(e => e.status === 'upcoming').length;

  // Update total count on the dashboard (if the element exists)
  const totalExamsElement = document.getElementById('totalExamsCount');
  if (totalExamsElement) {
    totalExamsElement.textContent = exams.length;
  }

  const activeExamsElement = document.getElementById('activeExamsCount');
  if (activeExamsElement) {
    activeExamsElement.textContent = activeExamsCount;
  }

  const upcomingExamsElement = document.getElementById('upcomingExamsCount');
  if (upcomingExamsElement) {
    upcomingExamsElement.textContent = upcomingExamsCount;
  }

  // Filter Logic
  let filteredExams = exams;
  if (searchQuery) {
    filteredExams = exams.filter(exam =>
      exam.title.toLowerCase().includes(searchQuery)
    );
  }

  // Pagination Logic
  const totalItems = filteredExams.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedExams = filteredExams.slice(startIndex, endIndex);

  const paginationInfoElement = document.getElementById('examTablePaginationInfo');
  if (paginationInfoElement) {
    const displayCount = totalItems > 0 ? `${startIndex + 1}-${endIndex}` : '0';
    paginationInfoElement.textContent = `Hiển thị ${displayCount} trên tổng số ${totalItems} kỳ thi`;
  }

  if (totalItems === 0) {
    examsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-slate-500">
                    Chưa có kỳ thi nào. Hãy tạo kỳ thi mới!
                </td>
            </tr>
        `;
    renderPagination(0);
    return;
  }

  let html = '';
  paginatedExams.forEach(exam => {
    html += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4">
                    <div class="font-semibold">${exam.title}</div>
                </td>
                <td class="px-6 py-4 text-sm">${getTypeLabel(exam.type)}</td>
                <td class="px-6 py-4">
                    ${getStatusBadge(exam.status)}
                </td>
                <td class="px-6 py-4 text-sm">${exam.questionsCount}</td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="editExam('${exam.id}')"
                            class="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Chỉnh sửa">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onclick="deleteExam('${exam.id}')"
                            class="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Xóa">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
  });

  examsTableBody.innerHTML = html;
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const paginationContainer = document.getElementById('examTablePagination');
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '';

  // Prev Button
  html += `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}
            class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            Trước
        </button>
    `;

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `
                <button
                    class="px-3 py-1.5 rounded-lg border border-primary bg-primary text-white text-sm font-medium">
                    ${i}
                </button>
            `;
    } else {
      html += `
                <button onclick="changePage(${i})"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium">
                    ${i}
                </button>
            `;
    }
  }

  // Next Button
  html += `
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}
            class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            Tiếp
        </button>
    `;

  paginationContainer.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderExams();
}

function deleteExam(id) {
  if (confirm('Bạn có chắc chắn muốn xóa kỳ thi này không?')) {
    let exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];
    exams = exams.filter(exam => exam.id !== id);
    localStorage.setItem('quiz_exams', JSON.stringify(exams));
    renderExams();
  }
}

function editExam(id) {
  // Navigate to edit page with ID params (mock logic)
  window.location.href = `admin-exam-edit.html?id=${id}`;
}
