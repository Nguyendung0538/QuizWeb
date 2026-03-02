let historyCurrentPage = 1;
const historyItemsPerPage = 5;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Mock Users if not exists
  let users = JSON.parse(localStorage.getItem('quiz_users')) || [];
  if (users.length <= 1) { // Only admin exists
    const mockUsers = [
      { id: Date.now() + 1, name: 'Sinh viên Ảo 1', username: 'sv_ao_1', email: 'svao1@ptit.edu.vn', password: '123', status: 'active', role: 'student' },
      { id: Date.now() + 2, name: 'Sinh viên Ảo 2', username: 'sv_ao_2', email: 'svao2@ptit.edu.vn', password: '123', status: 'active', role: 'student' },
      { id: Date.now() + 3, name: 'Sinh viên Ảo 3', username: 'sv_ao_3', email: 'svao3@ptit.edu.vn', password: '123', status: 'locked', role: 'student' }
    ];
    users = [...users, ...mockUsers];
    localStorage.setItem('quiz_users', JSON.stringify(users));
  }

  // 2. Initialize Mock Exams if not exists
  let exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];
  if (exams.length === 0) {
    const mockExams = [
      {
        id: 'mock_exam_1', title: 'Bài kiểm tra Mock 1', type: 'midterm', duration: 15, isPermanent: true, status: 'active', questionsCount: 3,
        questions: [
          { id: 1, text: 'Câu hỏi 1', options: ['A', 'B', 'C', 'D'], correctOption: 1 },
          { id: 2, text: 'Câu hỏi 2', options: ['A', 'B', 'C', 'D'], correctOption: 2 },
          { id: 3, text: 'Câu hỏi 3', options: ['A', 'B', 'C', 'D'], correctOption: 3 }
        ]
      },
      {
        id: 'mock_exam_2', title: 'Bài kiểm tra Mock 2', type: 'final', duration: 30, isPermanent: true, status: 'closed', questionsCount: 5,
        questions: [
          { id: 1, text: 'Câu 1', options: ['A', 'B', 'C', 'D'], correctOption: 0 },
          { id: 2, text: 'Câu 2', options: ['A', 'B', 'C', 'D'], correctOption: 1 },
          { id: 3, text: 'Câu 3', options: ['A', 'B', 'C', 'D'], correctOption: 2 },
          { id: 4, text: 'Câu 4', options: ['A', 'B', 'C', 'D'], correctOption: 3 },
          { id: 5, text: 'Câu 5', options: ['A', 'B', 'C', 'D'], correctOption: 0 }
        ]
      }
    ];
    exams = mockExams;
    localStorage.setItem('quiz_exams', JSON.stringify(exams));
  }

  // 2.5 Ensure all existing exams have at least 5 questions 
  let examsUpdated = false;
  exams = exams.map(exam => {
    if (!exam.questions || exam.questions.length === 0) {
      examsUpdated = true;
      exam.questions = Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        text: `Câu hỏi ngẫu nhiên ${i + 1} cho đề thi ${exam.title}`,
        options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correctOption: Math.floor(Math.random() * 4)
      }));
      exam.questionsCount = 5;
    }
    return exam;
  });

  if (examsUpdated) {
    localStorage.setItem('quiz_exams', JSON.stringify(exams));
  }

  if (!localStorage.getItem('_mock_regen_v3')) {
    localStorage.removeItem('quiz_submissions');
    localStorage.setItem('_mock_regen_v3', '1');
  }

  // 3. Initialize Mock Submissions if not exists
  if (!localStorage.getItem('quiz_submissions')) {
    const students = users.filter(u => u.role === 'student');
    const mockSubmissions = [];

    // Generate some realistic submissions based on virtual users and exams
    let subId = 1;

    // We only want to generate multiple attempts for the few virtual students to populate the charts.
    // Let's create a few submissions for each student to make the data richer.
    students.forEach((student) => {
      exams.forEach(exam => {
        // Generate 1-3 attempts per exam for each student to fill out the statistics
        const numAttempts = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numAttempts; i++) {
          // Generate simulated answers
          const answers = [];
          let correctCount = 0;

          if (exam.questions && exam.questions.length > 0) {
            exam.questions.forEach(q => {
              // Randomly select an answer 0-3
              const selected = Math.floor(Math.random() * 4);
              const isCorrect = selected === q.correctOption;
              if (isCorrect) correctCount++;

              answers.push({
                questionId: q.id,
                selectedOption: selected,
                isCorrect: isCorrect
              });
            });
          }

          // Calculate score (out of 10) based on correct answers
          const scorePerQ = exam.questionsCount > 0 ? 10 / exam.questionsCount : 0;
          const finalScore = +(correctCount * scorePerQ).toFixed(1);

          // Random duration
          const min = Math.floor(Math.random() * exam.duration);

          mockSubmissions.push({
            id: subId++,
            studentId: student.id,
            studentEmail: student.email,
            studentName: student.name,
            examId: exam.id,
            examTitle: exam.title,
            score: finalScore,
            answers: answers, // Storing simulated answers for the future details page
            timeSpent: `${min} phút ${(Math.random() * 59).toFixed(0)}s`,
            submittedAt: `10:${Math.floor(Math.random() * 59)} AM, 15/10/2023`
          });
        }
      });
    });

    localStorage.setItem('quiz_submissions', JSON.stringify(mockSubmissions));
  }

  renderStatistics();
});

function renderStatistics() {
  const submissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
  const users = JSON.parse(localStorage.getItem('quiz_users')) || [];
  const students = users.filter(u => u.role !== 'admin' && u.username !== 'admin');
  const exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];

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
    filteredSubmissions = submissions.filter(sub => sub.examId === currentFilter);
  }

  const totalSubmissions = filteredSubmissions.length;
  let totalScore = 0;
  filteredSubmissions.forEach(sub => totalScore += sub.score);
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
      const initial = sub.studentName ? sub.studentName.charAt(0).toUpperCase() : 'U';
      html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">${initial}</div>
                            <div>
                                <p class="text-sm font-bold text-slate-900">${sub.studentName}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm font-medium">${sub.examTitle}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">${sub.submittedAt}</td>
                    <td class="px-6 py-4 text-sm font-medium">${sub.timeSpent}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center justify-center px-2 py-1 ${sub.score >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} font-bold rounded text-sm">${sub.score.toFixed(1)}</span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="window.viewExamDetail(${sub.id})" class="text-sm font-semibold text-primary hover:text-red-700 transition-colors hover:underline">Xem chi tiết</button>
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
window.viewExamDetail = function (submissionId) {
  const submissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
  const exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];
  const sub = submissions.find(s => s.id === submissionId);
  if (!sub) return;

  const examMatch = exams.find(e => e.id === sub.examId);
  if (!examMatch || !examMatch.questions) {
    alert('Không tìm thấy dữ liệu đề thi gốc cho bài làm này!');
    return;
  }

  document.getElementById('modalExamTitle').textContent = `Kết Quả: ${sub.examTitle}`;
  document.getElementById('modalStudentName').textContent = `Sinh viên: ${sub.studentName} (${sub.studentEmail})`;

  const scoreEl = document.getElementById('modalExamScore');
  scoreEl.textContent = `${sub.score.toFixed(1)} / 10`;
  scoreEl.className = `text-xl font-bold ${sub.score >= 5 ? 'text-emerald-600' : 'text-red-600'}`;

  const container = document.getElementById('questionsDetailContainer');
  let html = '';

  examMatch.questions.forEach((q, index) => {
    let studentAns = sub.answers ? sub.answers.find(a => a.questionId === q.id) : null;
    let selectedOptIndex = studentAns ? studentAns.selectedOption : -1;
    let isCorrect = selectedOptIndex === q.correctOption;

    let bgColor = isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200';
    if (selectedOptIndex === -1) bgColor = 'bg-slate-50 border-slate-200';

    let icon = isCorrect
      ? '<span class="material-symbols-outlined text-emerald-500">check_circle</span>'
      : '<span class="material-symbols-outlined text-red-500">cancel</span>';
    if (selectedOptIndex === -1) icon = '<span class="material-symbols-outlined text-slate-400">help</span>';

    html += `
            <div class="p-6 rounded-xl border ${bgColor} shadow-sm bg-white dark:bg-slate-900">
                <div class="flex items-start gap-4">
                    <div class="shrink-0 flex items-center justify-center size-8 rounded-full bg-slate-100 font-bold text-sm text-slate-600">
                        ${index + 1}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-start justify-between gap-4 mb-4">
                            <h4 class="font-bold text-slate-800 text-base leading-relaxed">${q.text}</h4>
                            <div class="shrink-0 mt-0.5">${icon}</div>
                        </div>
                        <div class="space-y-2">
        `;

    q.options.forEach((opt, optIdx) => {
      let optBg = 'bg-slate-50 border-slate-200 text-slate-600';
      let checkIcon = '';

      if (optIdx === q.correctOption) {
        optBg = 'bg-emerald-500 text-white border-emerald-500 font-medium';
        checkIcon = '<span class="material-symbols-outlined text-[16px]">done</span>';
      } else if (optIdx === selectedOptIndex && selectedOptIndex !== q.correctOption) {
        optBg = 'bg-red-100 text-red-700 border-red-200 font-medium line-through decoration-red-400';
        checkIcon = '<span class="material-symbols-outlined text-[16px]">close</span>';
      }

      html += `
                <div class="flex items-center justify-between p-3 rounded-lg border ${optBg} transition-all">
                    <span class="text-sm">${opt}</span>
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

  container.innerHTML = html;
  const modal = document.getElementById('examDetailModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
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
    const s = sub.score;
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
    uniqueStudentIds.add(sub.studentId);
    const s = sub.score;
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

  const submissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
  let filteredSubmissions = submissions;
  if (currentFilter !== 'all') {
    filteredSubmissions = submissions.filter(sub => sub.examId === currentFilter);
  }

  if (filteredSubmissions.length === 0) {
    alert('Không có dữ liệu để xuất!');
    return;
  }

  const headers = ['Sinh vien', 'Email', 'Ky thi', 'So cau dung', 'Diem so', 'Thoi gian lam bai', 'Hoan thanh luc'];

  const exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];

  const rows = filteredSubmissions.map(sub => {
    let correctStr = 'N/A';
    if (sub.answers) {
      const correctCount = sub.answers.filter(a => a.isCorrect).length;
      const examMatch = exams.find(e => e.id === sub.examId);
      const totalQ = examMatch ? examMatch.questionsCount : sub.answers.length;
      // Prepending with an apostrophe or space forces Excel to treat it as text instead of a Date.
      // We'll use ="4/5" formula syntax which is the most reliable way in CSV for Excel
      correctStr = `="${correctCount}/${totalQ}"`;
    }

    return [
      `"${sub.studentName || ''}"`,
      `"${sub.studentEmail || ''}"`,
      `"${sub.examTitle || ''}"`,
      correctStr,
      sub.score.toFixed(1),
      `"${sub.timeSpent || ''}"`,
      `"${sub.submittedAt || ''}"`
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
