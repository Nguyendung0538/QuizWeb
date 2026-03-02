document.addEventListener('DOMContentLoaded', () => {
  if (typeof currentUser === 'undefined') return; // Handled by top script

  // Personalize UI
  document.getElementById('headerUserName').textContent = currentUser.name || currentUser.username;
  document.getElementById('welcomeText').textContent = `Xin chào, ${currentUser.name || currentUser.username}`;

  // Logout Logic
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('quiz_current_user');
    window.location.href = 'login.html';
  });

  // Load Exams (excluding closed ones)
  const allExams = JSON.parse(localStorage.getItem('quiz_exams')) || [];
  const activeExams = allExams.filter(ex => ex.status !== 'closed');

  const examGrid = document.getElementById('examGrid');
  const examCountText = document.getElementById('examCountText');

  let currentFilter = 'all';
  let currentSearch = '';

  function renderExams(data) {
    if (!examGrid) return;

    if (data.length === 0) {
      examGrid.innerHTML = '<div class="col-span-full py-20 text-center text-slate-500 font-medium">Không tìm thấy bài thi nào phù hợp.</div>';
      if (examCountText) examCountText.textContent = '0 bài thi tìm thấy';
      return;
    }

    if (examCountText) examCountText.textContent = `${data.length} bài thi tìm thấy`;

    examGrid.innerHTML = data.map(exam => {
      const isActive = exam.status === 'active';
      const statusConfig = {
        active: { bg: 'bg-emerald-100 text-emerald-700', label: 'Sẵn sàng' },
        upcoming: { bg: 'bg-amber-100 text-amber-700', label: 'Sắp diễn ra' },
        closed: { bg: 'bg-slate-100 text-slate-500', label: 'Đã đóng' }
      };
      const config = statusConfig[exam.status] || statusConfig.closed;

      return `
                <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div>
                        <div class="flex justify-between items-start mb-4">
                            <span class="px-3 py-1 rounded-full ${config.bg} text-xs font-bold uppercase tracking-wider">
                                ${config.label}
                            </span>
                        </div>
                        <h3 class="text-slate-900 text-lg font-bold leading-tight mb-4">${exam.title}</h3>
                        <div class="space-y-2 mb-6">
                            <div class="flex items-center gap-2 text-slate-500 text-sm">
                                <span class="material-symbols-outlined text-[18px]">quiz</span>
                                Số câu hỏi: ${exam.questionsCount || 0}
                            </div>
                            <div class="flex items-center gap-2 text-slate-500 text-sm">
                                <span class="material-symbols-outlined text-[18px]">schedule</span>
                                Thời gian: ${exam.duration || 60} phút
                            </div>
                        </div>
                    </div>
                    <button 
                        onclick="${isActive ? `window.location.href='exam.html?id=${exam.id}'` : ''}"
                        class="w-full ${isActive ? 'bg-primary text-white hover:brightness-110' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} py-2.5 rounded-lg font-bold text-sm active:scale-[0.98] transition-all"
                        ${!isActive ? 'disabled' : ''}>
                        ${isActive ? 'Bắt đầu làm bài' : 'Chưa mở'}
                    </button>
                </div>
            `;
    }).join('');
  }

  function applyFilters() {
    let filtered = activeExams;

    if (currentSearch) {
      filtered = filtered.filter(ex => ex.title.toLowerCase().includes(currentSearch));
    }

    if (currentFilter !== 'all') {
      filtered = filtered.filter(ex => ex.type === currentFilter);
    }

    renderExams(filtered);
  }

  // Initial render
  applyFilters();

  // Search filter
  const searchInput = document.querySelector('input[placeholder*="Tìm kiếm"]');
  searchInput?.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    applyFilters();
  });

  // Type filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active button styling
      filterBtns.forEach(b => {
        b.classList.remove('bg-primary', 'text-white', 'shadow-sm', 'hover:opacity-90');
        b.classList.add('bg-white', 'border', 'border-border-light', 'text-text-secondary', 'hover:bg-primary/5', 'hover:text-primary', 'hover:border-primary');
      });

      const targetBtn = e.currentTarget;
      targetBtn.classList.remove('bg-white', 'border', 'border-border-light', 'text-text-secondary', 'hover:bg-primary/5', 'hover:text-primary', 'hover:border-primary');
      targetBtn.classList.add('bg-primary', 'text-white', 'shadow-sm', 'hover:opacity-90');

      currentFilter = targetBtn.getAttribute('data-type');
      applyFilters();
    });
  });

  // --- TAB LOGIC & HISTORY ---
  const tabExams = document.getElementById('tabExams');
  const tabHistory = document.getElementById('tabHistory');
  const examListSection = document.getElementById('examListSection');
  const historySection = document.getElementById('historySection');
  const historyTableBody = document.getElementById('historyTableBody');

  tabExams?.addEventListener('click', () => {
    tabExams.className = 'pb-3 text-primary font-bold border-b-2 border-primary transition-colors';
    tabHistory.className = 'pb-3 text-slate-500 font-semibold hover:text-slate-800 transition-colors';
    examListSection.classList.remove('hidden');
    historySection.classList.add('hidden');
  });

  tabHistory?.addEventListener('click', () => {
    tabHistory.className = 'pb-3 text-primary font-bold border-b-2 border-primary transition-colors';
    tabExams.className = 'pb-3 text-slate-500 font-semibold hover:text-slate-800 transition-colors';
    historySection.classList.remove('hidden');
    examListSection.classList.add('hidden');
    renderHistory();
  });

  function renderHistory() {
    const allSubmissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
    // Filter submissions for current user
    const userSubmissions = allSubmissions.filter(sub =>
      sub.studentId === currentUser.id ||
      (sub.studentName === currentUser.name && sub.studentEmail === currentUser.email)
    ).reverse(); // Newest first

    if (userSubmissions.length === 0) {
      historyTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-slate-500">
                        Bạn chưa hoàn thành bài thi nào.
                    </td>
                </tr>
            `;
      return;
    }

    historyTableBody.innerHTML = userSubmissions.map(sub => `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="py-4 px-6">
                    <div class="font-bold text-slate-900">${sub.examTitle}</div>
                </td>
                <td class="py-4 px-6 text-slate-800 font-bold">
                    ${sub.score.toFixed(1)} <span class="text-xs text-slate-400 font-normal">/ 10</span>
                </td>
                <td class="py-4 px-6 text-slate-600">
                    ${sub.correctAnswers} / ${sub.totalQuestions}
                </td>
                <td class="py-4 px-6 text-slate-600">
                    ${sub.timeSpent}
                </td>
                <td class="py-4 px-6 text-slate-500 text-xs">
                    ${sub.submittedAt}
                </td>
                <td class="py-4 px-6 text-right">
                    <button onclick="viewResult(${sub.id})" class="text-primary hover:text-primary/80 font-semibold text-sm transition-colors">
                        Xem chi tiết
                    </button>
                </td>
            </tr>
        `).join('');
  }

  window.viewResult = function (submissionId) {
    sessionStorage.setItem('last_submission_id', submissionId);
    window.location.href = 'result.html';
  };
});
