document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('studentSearchInput');
  const searchResults = document.getElementById('studentSearchResults');
  const emptyState = document.getElementById('emptyState');
  const studentContent = document.getElementById('studentContent');
  const historyBody = document.getElementById('studentHistoryTableBody');
  const examDetailModal = document.getElementById('examDetailModal');

  let allUsers = JSON.parse(localStorage.getItem('quiz_users')) || [];
  let students = allUsers.filter(u => u.role === 'student');
  let submissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
  let exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];

  // Check if we came from admin-students page with a specific email
  const urlParams = new URLSearchParams(window.location.search);
  const emailToLoad = urlParams.get('email');
  if (emailToLoad) {
    const student = students.find(s => s.email === emailToLoad);
    if (student) {
      selectStudent(student);
    }
  }

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
    const studentSubs = submissions.filter(sub => sub.studentEmail === student.email || sub.studentId === student.id).sort((a, b) => b.id - a.id);

    document.getElementById('studentTotalExamsDisplay').textContent = studentSubs.length;

    // Render Table
    if (studentSubs.length === 0) {
      historyBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">Người dùng này chưa làm bài thi nào.</td></tr>';
      return;
    }

    let html = '';
    studentSubs.forEach(sub => {
      const isPassed = sub.score >= 5;
      const statusHtml = isPassed
        ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600"><span class="size-1.5 rounded-full bg-emerald-500"></span>Đạt</span>`
        : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-600"><span class="size-1.5 rounded-full bg-amber-500"></span>Chưa đạt</span>`;

      html += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-medium text-sm text-slate-900">${sub.examTitle}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">${sub.submittedAt}</td>
                    <td class="px-6 py-4 text-sm text-slate-500">${sub.timeSpent}</td>
                    <td class="px-6 py-4 text-center">${statusHtml}</td>
                    <td class="px-6 py-4 text-right">
                        <span class="inline-block px-2 py-1 rounded font-bold text-sm ${isPassed ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}">${sub.score.toFixed(1)}</span>
                    </td>
                    <td class="px-6 py-4 text-center relative">
                        <button onclick="window.viewExamDetail(${sub.id})" class="text-sm font-semibold text-primary hover:text-red-700 transition-colors hover:underline">Xem chi tiết</button>
                    </td>
                </tr>
            `;
    });
    historyBody.innerHTML = html;
  }

  // Detail Modal Logic
  window.viewExamDetail = function (submissionId) {
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
      // Find student's answer for this question
      let studentAns = sub.answers ? sub.answers.find(a => a.questionId === q.id) : null;
      let selectedOptIndex = studentAns ? studentAns.selectedOption : -1;
      let isCorrect = selectedOptIndex === q.correctOption;

      let bgColor = isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200';
      if (selectedOptIndex === -1) bgColor = 'bg-slate-50 border-slate-200'; // Unanswered

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
          optBg = 'bg-emerald-500 text-white border-emerald-500 font-medium'; // Correct answer is solid green
          checkIcon = '<span class="material-symbols-outlined text-[16px]">done</span>';
        } else if (optIdx === selectedOptIndex && selectedOptIndex !== q.correctOption) {
          optBg = 'bg-red-100 text-red-700 border-red-200 font-medium line-through decoration-red-400'; // Wrong selected answer is red and struck through
          checkIcon = '<span class="material-symbols-outlined text-[16px]">close</span>';
        } else if (optIdx === selectedOptIndex && selectedOptIndex === q.correctOption) {
          // Correctly selected, already handled by solid green above.
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
    examDetailModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden'); // Prevent background scrolling
  };

  // Close Modals
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      examDetailModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
  });
});
