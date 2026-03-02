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
  const statusFilter = document.getElementById('statusExamFilter');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentPage = 1;
      renderExams();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      currentPage = 1;
      renderExams();
    });
  }

  // Multi-delete setup
  const selectAllCheckbox = document.getElementById('selectAllExams');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const examCheckboxes = document.querySelectorAll('.exam-checkbox');
      examCheckboxes.forEach(cb => {
        cb.checked = isChecked;
      });
      updateSelectedCount();
    });
  }

  const multiDeleteBtn = document.getElementById('multiDeleteBtn');
  if (multiDeleteBtn) {
    multiDeleteBtn.addEventListener('click', () => {
      const selectedBoxes = document.querySelectorAll('.exam-checkbox:checked');
      if (selectedBoxes.length === 0) return;

      document.getElementById('deleteMultipleCount').textContent = selectedBoxes.length;
      openMultiDeleteModal();
    });
  }

  const deleteMultipleModal = document.getElementById('deleteMultipleModal');
  const deleteMultipleModalOverlay = document.getElementById('deleteMultipleModalOverlay');
  const deleteMultipleModalContent = document.getElementById('deleteMultipleModalContent');

  document.querySelectorAll('.delete-multiple-close').forEach(btn => {
    btn.addEventListener('click', closeMultiDeleteModal);
  });

  const confirmDeleteMultipleBtn = document.getElementById('confirmDeleteMultipleBtn');
  if (confirmDeleteMultipleBtn) {
    confirmDeleteMultipleBtn.addEventListener('click', () => {
      const selectedBoxes = document.querySelectorAll('.exam-checkbox:checked');
      const idsToDelete = Array.from(selectedBoxes).map(cb => cb.dataset.id);

      let exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];
      exams = exams.filter(exam => !idsToDelete.includes(exam.id));
      localStorage.setItem('quiz_exams', JSON.stringify(exams));

      closeMultiDeleteModal();

      const selectAllCheckbox = document.getElementById('selectAllExams');
      if (selectAllCheckbox) selectAllCheckbox.checked = false;

      renderExams();
    });
  }

  window.handleExamSelection = function () {
    const examCheckboxes = document.querySelectorAll('.exam-checkbox');
    const allChecked = Array.from(examCheckboxes).every(cb => cb.checked);
    const selectAllCheckbox = document.getElementById('selectAllExams');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = allChecked && examCheckboxes.length > 0;
    }
    updateSelectedCount();
  };

  function updateSelectedCount() {
    const selectedCount = document.querySelectorAll('.exam-checkbox:checked').length;
    const countEl = document.getElementById('selectedCount');
    const multiDeleteBtn = document.getElementById('multiDeleteBtn');

    if (countEl) countEl.textContent = selectedCount;
    if (multiDeleteBtn) {
      if (selectedCount > 0) {
        multiDeleteBtn.classList.remove('hidden');
        multiDeleteBtn.classList.add('flex');
      } else {
        multiDeleteBtn.classList.add('hidden');
        multiDeleteBtn.classList.remove('flex');
      }
    }
  }

  function openMultiDeleteModal() {
    if (!deleteMultipleModal) return;
    deleteMultipleModal.classList.remove('hidden');
    void deleteMultipleModal.offsetWidth; // trigger reflow
    deleteMultipleModalOverlay.classList.remove('opacity-0');
    deleteMultipleModalContent.classList.remove('opacity-0', 'scale-95');
    deleteMultipleModalContent.classList.add('scale-100');
  }

  function closeMultiDeleteModal() {
    if (!deleteMultipleModal) return;
    deleteMultipleModalOverlay.classList.add('opacity-0');
    deleteMultipleModalContent.classList.remove('scale-100');
    deleteMultipleModalContent.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
      deleteMultipleModal.classList.add('hidden');
    }, 300);
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
  const statusFilter = document.getElementById('statusExamFilter');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const statusQuery = statusFilter ? statusFilter.value : 'all';

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

  let filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery);
    let matchesStatus = true;
    if (statusQuery === 'active') matchesStatus = exam.status === 'active';
    if (statusQuery === 'closed') matchesStatus = exam.status === 'closed';
    if (statusQuery === 'upcoming') matchesStatus = exam.status === 'upcoming';

    return matchesSearch && matchesStatus;
  });

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
                <td colspan="6" class="px-6 py-8 text-center text-slate-500">
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
                    <input type="checkbox" onclick="handleExamSelection()" data-id="${exam.id}" class="exam-checkbox rounded border-slate-300 text-primary focus:ring-primary">
                </td>
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

  if (totalPages === 0) totalPages = 1;

  let html = '';

  // Prev Button
  html += `<button onclick="changePage(${currentPage - 1})" class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg ${currentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:border-primary hover:text-primary transition-colors'}">Trước</button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      if (i === currentPage) {
        html += `<button class="w-8 h-8 flex items-center justify-center text-sm font-medium border border-primary bg-primary/10 text-primary rounded-lg">${i}</button>`;
      } else {
        html += `<button onclick="changePage(${i})" class="w-8 h-8 flex items-center justify-center text-sm font-medium border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors rounded-lg">${i}</button>`;
      }
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      if (html.includes('<!-- last ... break -->')) continue;
      html += `<span class="px-2 text-slate-400">...</span>`;
    }
  }

  // Next Button
  html += `<button onclick="changePage(${currentPage + 1})" class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg ${currentPage === totalPages || totalPages === 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:border-primary hover:text-primary transition-colors'}">Tiếp</button>`;

  paginationContainer.innerHTML = html;
}

function changePage(page) {
  const exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];
  const statusFilter = document.getElementById('statusExamFilter');
  const searchInput = document.getElementById('searchExamInput');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const statusQuery = statusFilter ? statusFilter.value : 'all';

  let filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery);
    let matchesStatus = true;
    if (statusQuery === 'active') matchesStatus = exam.status === 'active';
    if (statusQuery === 'closed') matchesStatus = exam.status === 'closed';
    if (statusQuery === 'upcoming') matchesStatus = exam.status === 'upcoming';

    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredExams.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderExams();
  }
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
