let students = [];
let submissions = [];
let exams = [];

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('studentSearchInput');
  const searchResults = document.getElementById('studentSearchResults');
  const emptyState = document.getElementById('emptyState');
  const studentContent = document.getElementById('studentContent');
  const historyBody = document.getElementById('studentHistoryTableBody');
  const examDetailModal = document.getElementById('examDetailModal');

  async function fetchResultsData() {
      try {
          if (!window.API) return;
          
          const [fetchedUsers, fetchedSubmissions, fetchedExams] = await Promise.all([
              window.API.get('/users'),
              window.API.get('/submissions/all'),
              window.API.get('/exams')
          ]);
          
          const allUsers = fetchedUsers || [];
          students = allUsers.filter(u => u.role === 'student');
          submissions = fetchedSubmissions || [];
          exams = fetchedExams || [];

          // Check if we came from admin-students page with a specific email
          const urlParams = new URLSearchParams(window.location.search);
          const emailToLoad = urlParams.get('email');
          if (emailToLoad) {
            const student = students.find(s => s.email === emailToLoad);
            if (student) {
              selectStudent(student);
            }
          }
      } catch (error) {
          console.error("Lỗi khi tải dữ liệu:", error);
      }
  }

  fetchResultsData();

  // Handle Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length === 0) {
        searchResults.classList.add('hidden');
        return;
      }

      const matches = students.filter(s =>
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        (s.username && s.username.toLowerCase().includes(query))
      );

      renderSearchResults(matches);
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }

  function renderSearchResults(matches) {
    if (matches.length === 0) {
      searchResults.innerHTML = '<div class="p-4 text-sm text-slate-500 text-center">Không tìm thấy sinh viên nào.</div>';
      searchResults.classList.remove('hidden');
      return;
    }

    let html = '';
    matches.forEach(student => {
      const initial = student.name ? student.name.charAt(0).toUpperCase() : 'U';
      html += `
                <div class="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-100 last:border-0" onclick="window.selectStudentLocal('${student.email}')">
                    <div class="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        ${initial}
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-slate-900">${student.name || student.username}</p>
                        <p class="text-xs text-slate-500">${student.email}</p>
                    </div>
                </div>
            `;
    });

    searchResults.innerHTML = html;
    searchResults.classList.remove('hidden');
  }

  window.selectStudentLocal = function (email) {
    const student = students.find(s => s.email === email);
    if (student) {
      searchInput.value = student.name || student.username;
      searchResults.classList.add('hidden');
      selectStudent(student);
    }
  };

  function selectStudent(student) {
    // Show Content, Hide Empty State
    emptyState.classList.add('hidden');
    studentContent.classList.remove('hidden');

    // Update Student Info Card
    const initial = student.name ? student.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('studentAvatar').textContent = initial;
    document.getElementById('studentNameDisplay').textContent = student.name || student.username;
    document.getElementById('studentEmailDisplay').textContent = student.email;

    // Fetch their submissions
    const studentSubs = submissions.filter(sub => sub.student_email === student.email || sub.student_id === student.id).sort((a, b) => b.id - a.id);

    document.getElementById('studentTotalExamsDisplay').textContent = studentSubs.length;

    // Render Table
    if (studentSubs.length === 0) {
      historyBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">Người dùng này chưa làm bài thi nào.</td></tr>';
      return;
    }

    let html = '';
    studentSubs.forEach(sub => {
      const scoreNum = parseFloat(sub.score || 0);
      const isPassed = scoreNum >= 5;
      const statusHtml = isPassed
        ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600"><span class="size-1.5 rounded-full bg-emerald-500"></span>Đạt</span>`
        : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-600"><span class="size-1.5 rounded-full bg-amber-500"></span>Chưa đạt</span>`;

      html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-medium text-sm text-slate-900">${sub.exam_title || 'N/A'}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">${new Date(sub.submitted_at).toLocaleString('vi-VN')}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">${sub.time_spent || 0}s</td>
                    <td class="px-6 py-4 text-center">${statusHtml}</td>
                    <td class="px-6 py-4 text-right">
                        <span class="inline-block px-2 py-1 rounded font-bold text-sm ${isPassed ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}">${scoreNum.toFixed(1)}</span>
                    </td>
                    <td class="px-6 py-4 text-center relative">
                        <button onclick="window.viewExamDetail('${sub.id}')" class="text-sm font-semibold text-primary hover:text-red-700 transition-colors hover:underline">Xem chi tiết</button>
                    </td>
                </tr>
            `;
    });
    historyBody.innerHTML = html;
  }

  // Detail Modal Logic
  window.viewExamDetail = async function (submissionId) {
    try {
        if (!window.API) return;
        const sub = await window.API.get(`/submissions/${submissionId}`);
        if (!sub) return;

        const examMatch = exams.find(e => e.id == sub.exam_id);
        if (!examMatch) {
            console.warn('Exam not fully cached.');
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
          if (selectedOptIndex === -1) bgColor = 'bg-slate-50 border-slate-200'; // Unanswered

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
          optBg = 'bg-emerald-500 text-white border-emerald-500 font-medium'; // Correct answer is solid green
          checkIcon = '<span class="material-symbols-outlined text-[16px]">done</span>';
          if (optIdx === selectedOptIndex) {
            labelText = opt + ' <span class="text-emerald-100 text-xs ml-1">(Đã chọn)</span>';
          }
        } else if (optIdx === selectedOptIndex && selectedOptIndex !== ans.correct_option) {
          optBg = 'bg-red-100 text-red-700 border-red-200 font-medium line-through decoration-red-400'; // Wrong selected answer is red and struck through
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
    examDetailModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden'); // Prevent background scrolling
  } catch(error) {
      console.error(error);
  }
  };

  // Close Modals
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      examDetailModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
  });
});
