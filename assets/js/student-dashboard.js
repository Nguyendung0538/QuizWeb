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
      const isUpcoming = exam.status === 'upcoming';
      const statusConfig = {
        active: { bg: 'bg-emerald-100 text-emerald-700', label: 'Sẵn sàng' },
        upcoming: { bg: 'bg-amber-100 text-amber-700', label: 'Sắp diễn ra' },
        closed: { bg: 'bg-slate-100 text-slate-500', label: 'Đã đóng' }
      };
      const config = statusConfig[exam.status] || statusConfig.closed;

      return `
                <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group" 
                     data-id="${exam.id}" data-start="${exam.startTime || ''}">
                    <div>
                        <div class="flex justify-between items-start mb-4">
                            <span class="px-3 py-1 rounded-full ${config.bg} text-xs font-bold uppercase tracking-wider status-badge">
                                ${config.label}
                            </span>
                            ${isUpcoming ? `<span class="countdown-timer text-xs font-bold text-amber-600 flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">timer</span>
                                <span class="timer-text">--:--</span>
                            </span>` : ''}
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
                        id="btn-${exam.id}"
                        onclick="${isActive ? `window.location.href='exam.html?id=${exam.id}'` : ''}"
                        class="w-full ${isActive ? 'bg-primary text-white hover:brightness-110' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} py-2.5 rounded-lg font-bold text-sm active:scale-[0.98] transition-all"
                        ${!isActive ? 'disabled' : ''}>
                        ${isActive ? 'Bắt đầu làm bài' : 'Chưa mở'}
                    </button>
                </div>
            `;
    }).join('');
  }

  function updateCountdowns() {
    const cards = document.querySelectorAll('[data-start]');
    const now = new Date().getTime();
    let needsRefresh = false;

    cards.forEach(card => {
      const startTimeStr = card.getAttribute('data-start');
      if (!startTimeStr) return;

      const startTime = new Date(startTimeStr).getTime();
      const diff = startTime - now;
      const timerText = card.querySelector('.timer-text');
      const examId = card.getAttribute('data-id');

      if (diff > 0) {
        if (timerText) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);

          let display = "";
          if (hours > 0) display += `${hours}h `;
          display += `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          timerText.textContent = `Bắt đầu sau: ${display}`;
        }
      } else {
        // Time hit zero! Change status to active
        // Normally we'd call API to update status, or let backend calculate dynamically.
        // For frontend UI, we'll just reload the exams from the backend to get fresh true status.
        needsRefresh = true;
      }
    });

    if (needsRefresh) {
      location.reload(); // Simplest way to refresh all lists and data
    }
  }

  // Start countdown interval
  setInterval(updateCountdowns, 1000);
  updateCountdowns(); // Initial call

  let cachedExams = [];

  async function applyFilters() {
    let examsForFiltering = cachedExams;
    let filtered = examsForFiltering.filter(ex => ex.status !== 'closed');

    if (currentSearch) {
      filtered = filtered.filter(ex => ex.title.toLowerCase().includes(currentSearch));
    }

    if (currentFilter !== 'all') {
      filtered = filtered.filter(ex => ex.type === currentFilter);
    }

    renderExams(filtered);
  }

  async function initDashboard() {
     try {
         if(!window.API) return;
         cachedExams = await window.API.get('/exams');
         applyFilters();
     } catch (e) {
         console.error("Failed to load exams", e);
         if (examGrid) examGrid.innerHTML = '<div class="col-span-full py-20 text-center text-red-500 font-medium">Lỗi kết nối máy chủ.</div>';
     }
  }

  // Initial render
  initDashboard();

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

  async function renderHistory() {
      historyTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8">Đang tải...</td></tr>`;
      
      try {
          if(!window.API) return;
          const userSubmissions = await window.API.get(`/submissions/student/${currentUser.id}`);
          
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
                            <div class="font-bold text-slate-900">${sub.exam_title || `Kỳ thi ID: ${sub.exam_id}`}</div>
                        </td>
                        <td class="py-4 px-6 text-slate-800 font-bold">
                            ${parseFloat(sub.score).toFixed(1)} <span class="text-xs text-slate-400 font-normal">/ 10</span>
                        </td>
                        <td class="py-4 px-6 text-slate-600">
                            ${sub.correct_answers} / ${sub.total_questions}
                        </td>
                        <td class="py-4 px-6 text-slate-600">
                            ${sub.time_spent} giây
                        </td>
                        <td class="py-4 px-6 text-slate-500 text-xs">
                            ${new Date(sub.submitted_at).toLocaleString('vi-VN')}
                        </td>
                        <td class="py-4 px-6 text-right">
                            <button onclick="viewResult(${sub.id})" class="text-primary hover:text-primary/80 font-semibold text-sm transition-colors">
                                Xem chi tiết
                            </button>
                        </td>
                    </tr>
                `).join('');

      } catch (error) {
          console.error("Lỗi tải lịch sử:", error);
           historyTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-red-500">
                        Lỗi tải dữ liệu lịch sử.
                    </td>
                </tr>
            `;
      }
  }

  window.viewResult = function (submissionId) {
    sessionStorage.setItem('last_submission_id', submissionId);
    window.location.href = 'result.html';
  };
});
