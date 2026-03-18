let historyCurrentPage = 1;
const historyItemsPerPage = 5;

document.addEventListener('DOMContentLoaded', () => {
  fetchStatisticsData();
});

let globalSubmissions = [];
let globalUsers = [];
let globalExams = [];

async function fetchStatisticsData() {
    try {
        if (!window.API) return;
        
        // Fetch all data concurrently
        const [submissions, users, exams] = await Promise.all([
            window.API.get('/submissions/all'),
            window.API.get('/users'),
            window.API.get('/exams')
        ]);
        
        globalSubmissions = submissions || [];
        globalUsers = users || [];
        globalExams = exams || [];
        
        renderStatistics();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê:", error);
        alert('Không thể tải dữ liệu thống kê: ' + error.message);
    }
}

function renderStatistics() {
  let submissions = globalSubmissions;

  // Auto-repair NaN timeSpent labels (can keep just in case old db formats remain conceptually)
  submissions = submissions.map(sub => {
    if (typeof sub.time_spent === 'string' && sub.time_spent.includes('NaN')) {
      return { ...sub, time_spent: sub.time_spent.replace('NaN phút ', '') };
    }
    return sub;
  });

  const students = globalUsers.filter(u => u.role !== 'admin' && u.username !== 'admin');
  const exams = globalExams;

  // Setup filter options if not yet done
  const filterSelect = document.getElementById('examFilterSelect');
  if (filterSelect && filterSelect.options.length === 1) {
    exams.forEach(ex => {
      const option = document.createElement('option');
      option.value = ex.id;
      option.textContent = ex.title;
      filterSelect.appendChild(option);
    });

    filterSelect.addEventListener('change', renderStatistics);
  }

  const currentFilter = filterSelect ? filterSelect.value : 'all';
  let filteredSubmissions = submissions;
  if (currentFilter !== 'all') {
    filteredSubmissions = submissions.filter(sub => sub.exam_id == currentFilter);
  }

  const totalSubmissions = filteredSubmissions.length;
  let totalScore = 0;
  filteredSubmissions.forEach(sub => totalScore += parseFloat(sub.score || 0));
  const avgScore = totalSubmissions > 0 ? (totalScore / totalSubmissions).toFixed(1) : 0;

  // Update Overview Cards
  document.getElementById('totalSubmissionsCount').textContent = totalSubmissions.toLocaleString();
  document.getElementById('avgScoreText').textContent = avgScore;
  document.getElementById('avgScoreSubtext').textContent = `Dựa trên ${totalSubmissions.toLocaleString()} bài thi`;

  // Render Recent History Table with Pagination
  const historyBody = document.getElementById('recentHistoryTableBody');
  if (historyBody) {
    const sortedSubmissions = [...filteredSubmissions].sort((a, b) => b.id - a.id);
    const totalItems = sortedSubmissions.length;
    const totalPages = Math.ceil(totalItems / historyItemsPerPage);

    if (historyCurrentPage > totalPages && totalPages > 0) {
      historyCurrentPage = totalPages;
    }

    const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
    const endIndex = Math.min(startIndex + historyItemsPerPage, totalItems);
    const paginated = sortedSubmissions.slice(startIndex, endIndex);

    let html = '';
    paginated.forEach(sub => {
      const studentName = sub.student_name || 'N/A';
      const initial = studentName.charAt(0).toUpperCase();
      const scoreNum = parseFloat(sub.score || 0);
      html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">${initial}</div>
                            <div>
                                <p class="text-sm font-bold text-slate-900">${studentName}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm font-medium">${sub.exam_title || 'N/A'}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">${new Date(sub.submitted_at).toLocaleString('vi-VN')}</td>
                    <td class="px-6 py-4 text-sm font-medium">${sub.time_spent || 0}s</td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center justify-center px-2 py-1 ${scoreNum >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} font-bold rounded text-sm">${scoreNum.toFixed(1)}</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="window.viewExamDetail('${sub.id}')" class="text-sm font-semibold text-primary hover:text-red-700 transition-colors hover:underline">Xem chi tiết</button>
                    </td>
                </tr>
            `;
    });
    if (totalItems === 0) {
      html = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>';
    }
    historyBody.innerHTML = html;

    // Render pagination controls
    renderHistoryPagination(totalPages, totalItems, startIndex, endIndex);
  }

  // Chart logic
  renderCharts(filteredSubmissions, students);
}

window.goToHistoryPage = function (page) {
  historyCurrentPage = page;
  renderStatistics();
};

function renderHistoryPagination(totalPages, totalItems, startIndex, endIndex) {
  const paginationContainer = document.getElementById('tablePagination');
  const infoContainer = document.getElementById('paginationInfo');
  if (!paginationContainer || !infoContainer) return;

  if (totalItems === 0) {
    paginationContainer.innerHTML = '';
    infoContainer.innerHTML = '';
    return;
  }

  infoContainer.innerHTML = `Hiển thị <span class="font-medium text-slate-900">${startIndex + 1}-${endIndex}</span> trên tổng số <span class="font-medium text-slate-900">${totalItems}</span> lượt`;

  if (totalPages === 0) totalPages = 1;

  let html = '';
  html += `<button onclick="goToHistoryPage(${historyCurrentPage - 1})" class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg ${historyCurrentPage === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:border-primary hover:text-primary transition-colors'}">Trước</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= historyCurrentPage - 1 && i <= historyCurrentPage + 1)) {
      if (i === historyCurrentPage) {
        html += `<button class="w-8 h-8 flex items-center justify-center text-sm font-medium border border-primary bg-primary/10 text-primary rounded-lg">${i}</button>`;
      } else {
        html += `<button onclick="goToHistoryPage(${i})" class="w-8 h-8 flex items-center justify-center text-sm font-medium border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors rounded-lg">${i}</button>`;
      }
    } else if (i === historyCurrentPage - 2 || i === historyCurrentPage + 2) {
      html += `<span class="px-2 text-slate-400">...</span>`;
    }
  }

  html += `<button onclick="goToHistoryPage(${historyCurrentPage + 1})" class="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg ${historyCurrentPage === totalPages ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:border-primary hover:text-primary transition-colors'}">Tiếp</button>`;
  paginationContainer.innerHTML = html;
}

// Detail Modal Logic
window.viewExamDetail = async function (submissionId) {
  try {
      if (!window.API) return;
      
      const sub = await window.API.get(`/submissions/${submissionId}`);
      if (!sub) return;

      const examMatch = globalExams.find(e => e.id == sub.exam_id);
      if (!examMatch) {
          // Attempt to fetch if not cached completely
          console.warn('Exam not found in global cache by exam_id.');
      }

      document.getElementById('modalExamTitle').textContent = `Kết Quả: ${sub.exam_title || 'N/A'}`;
      document.getElementById('modalStudentName').textContent = `Sinh viên: ${sub.student_name || 'N/A'} (${sub.student_email || 'N/A'})`;

      const scoreEl = document.getElementById('modalExamScore');
      let correctCount = sub.correct_answers || 0;
      let totalQ = sub.total_questions || 0;
      const scoreNum = parseFloat(sub.score || 0);

      scoreEl.innerHTML = `${scoreNum.toFixed(1)} / 10<br><span class="text-xs font-medium text-slate-500 mt-1 block">Đúng: ${correctCount}/${totalQ}</span>`;
      scoreEl.className = `text-xl font-bold ${scoreNum >= 5 ? 'text-emerald-600' : 'text-red-600'}`;

      const container = document.getElementById('questionsDetailContainer');
      let html = '';

      if (sub.answers && Array.isArray(sub.answers)) {
          sub.answers.forEach((ans, index) => {
            let selectedOptIndex = ans.selected_option !== null ? ans.selected_option : -1;
            let isCorrect = selectedOptIndex === ans.correct_option;

            let bgColor = isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200';
            if (selectedOptIndex === -1) bgColor = 'bg-slate-50 border-slate-200';

    let badgeHtml = isCorrect
      ? '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check</span> Chấm đúng</span>'
      : '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">close</span> Chọn sai</span>';

    let textClass = 'text-slate-800';

    if (selectedOptIndex === -1) {
      badgeHtml = '<span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded flex items-center gap-1 border border-amber-200"><span class="material-symbols-outlined text-[14px]">horizontal_rule</span> Chưa chọn đáp án</span>';
      textClass = 'text-amber-700';
    }

            html += `
                    <div class="p-6 rounded-xl border ${bgColor} shadow-sm bg-white dark:bg-slate-900">
                        <div class="flex items-start gap-4">
                            <div class="shrink-0 flex items-center justify-center size-8 rounded-full bg-slate-100 font-bold text-sm text-slate-600">
                                ${index + 1}
                            </div>
                            <div class="flex-1">
                                <div class="flex items-start justify-between gap-4 mb-4">
                                    <h4 class="font-bold ${textClass} text-base leading-relaxed">${ans.question_text || 'N/A'}</h4>
                                    <div class="shrink-0 mt-0.5">${badgeHtml}</div>
                                </div>
                                <div class="space-y-2">
                `;

            const options = [ans.option_a, ans.option_b, ans.option_c, ans.option_d];
            options.forEach((opt, optIdx) => {
              let optBg = 'bg-slate-50 border-slate-200 text-slate-600';
              let checkIcon = '';
              let labelText = opt;

              if (optIdx === ans.correct_option) {
                optBg = 'bg-emerald-500 text-white border-emerald-500 font-medium';
                checkIcon = '<span class="material-symbols-outlined text-[16px]">done</span>';
                if (optIdx === selectedOptIndex) {
                  labelText = opt + ' <span class="text-emerald-100 text-xs ml-1">(Đã chọn)</span>';
                }
              } else if (optIdx === selectedOptIndex && selectedOptIndex !== ans.correct_option) {
                optBg = 'bg-red-100 text-red-700 border-red-200 font-medium line-through decoration-red-400';
                checkIcon = '<span class="material-symbols-outlined text-[16px]">close</span>';
                labelText = opt + ' <span class="text-red-500 text-xs ml-1">(Đã chọn)</span>';
              }

              html += `
                        <div class="flex items-center justify-between p-3 rounded-lg border ${optBg} transition-all">
                            <span class="text-sm">${labelText}</span>
                            ${checkIcon}
                        </div>
                    `;
            });

            html += `
                                </div>
                            </div>
                        </div>
                    </div>
                `;
          });
      }

      container.innerHTML = html;
      const modal = document.getElementById('examDetailModal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
  } catch (error) {
      console.error("Lỗi khi tải chi tiết phần thi:", error);
      alert('Không thể tải chi tiết bài thi: ' + error.message);
  }
};

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = document.getElementById('examDetailModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  });
});

// Global chart references so we can destroy them before re-rendering
let barChartInstance = null;
let doughnutChartInstance = null;

function renderCharts(submissions, students) {
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = '#64748b'; // Tailwind slate-500

  // 1. Histogram
  const bins = [0, 0, 0, 0, 0, 0, 0]; // <4, 4-5, 5-6, 6-7, 7-8, 8-9, 9-10
  submissions.forEach(sub => {
    const s = parseFloat(sub.score || 0);
    if (s < 4.0) bins[0]++;
    else if (s < 5.0) bins[1]++;
    else if (s < 6.0) bins[2]++;
    else if (s < 7.0) bins[3]++;
    else if (s < 8.0) bins[4]++;
    else if (s < 9.0) bins[5]++;
    else bins[6]++;
  });

  const ctxBar = document.getElementById('scoreHistogram')?.getContext('2d');
  if (ctxBar) {
    if (barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['< 4.0', '4.0-5.0', '5.0-6.0', '6.0-7.0', '7.0-8.0', '8.0-9.0', '9.0-10'],
        datasets: [{
          label: 'Số lượng bài thi',
          data: bins,
          backgroundColor: '#d41c34', // Tailwind primary
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9', borderDash: [5, 5] }, border: { display: false } },
          x: { grid: { display: false }, border: { display: false } }
        }
      }
    });
  }

  // 2. Doughnut (Grade bounds)
  const grades = [0, 0, 0, 0]; // Giỏi (>=8.5), Khá (7.0-8.4), TB (5.0-6.9), Yếu (<5.0)
  const uniqueStudentIds = new Set();

  submissions.forEach(sub => {
    if(sub.student_id) uniqueStudentIds.add(sub.student_id);
    const s = parseFloat(sub.score || 0);
    if (s >= 8.5) grades[0]++;
    else if (s >= 7.0) grades[1]++;
    else if (s >= 5.0) grades[2]++;
    else grades[3]++;
  });

  document.getElementById('totalStudentsChartCount').textContent = uniqueStudentIds.size.toLocaleString();

  const ctxDoughnut = document.getElementById('gradeDoughnut')?.getContext('2d');
  if (ctxDoughnut) {
    if (doughnutChartInstance) doughnutChartInstance.destroy();

    doughnutChartInstance = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: ['Giỏi', 'Khá', 'Trung bình', 'Yếu'],
        datasets: [{
          data: grades.reduce((a, b) => a + b, 0) > 0 ? grades : [1, 1, 1, 1],
          backgroundColor: ['#10b981', '#3b82f6', '#fbbf24', '#ef4444'],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || '';
                if (label) { label += ': '; }
                if (context.parsed !== null) {
                  label += context.parsed + ' lượt';
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
}

// Implement CSV Export
document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
  const filterSelect = document.getElementById('examFilterSelect');
  const currentFilter = filterSelect ? filterSelect.value : 'all';

  const submissions = globalSubmissions;
  let filteredSubmissions = submissions;
  if (currentFilter !== 'all') {
    filteredSubmissions = submissions.filter(sub => sub.exam_id == currentFilter);
  }

  if (filteredSubmissions.length === 0) {
    alert('Không có dữ liệu để xuất!');
    return;
  }

  const headers = ['Sinh vien', 'Email', 'Ky thi', 'So cau dung', 'Diem so', 'Thoi gian lam bai', 'Hoan thanh luc'];

  const rows = filteredSubmissions.map(sub => {
    let correctCount = sub.correct_answers || 0;
    let totalQ = sub.total_questions || 0;

    let correctStr = totalQ ? `="${correctCount}/${totalQ}"` : 'N/A';
    const scoreNum = parseFloat(sub.score || 0);

    return [
      `"${sub.student_name || ''}"`,
      `"${sub.student_email || ''}"`,
      `"${sub.exam_title || ''}"`,
      correctStr,
      scoreNum.toFixed(1),
      `"${sub.time_spent || 0}s"`,
      `"${new Date(sub.submitted_at).toLocaleString('vi-VN') || ''}"`
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `BaoCao_ThongKe_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
