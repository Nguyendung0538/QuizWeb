document.addEventListener('DOMContentLoaded', () => {
  // 1. Check Auth
  const currentUser = JSON.parse(localStorage.getItem('quiz_current_user'));
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // 2. Load latest submission
  const lastSubmissionId = sessionStorage.getItem('last_submission_id');
  if (!lastSubmissionId) {
    // If no recent submission in session, redirect or show error
    alert('Không tìm thấy kết quả bài thi gần nhất!');
    window.location.href = 'student-dashboard.html';
    return;
  }

  const submissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
  const submission = submissions.find(s => s.id == lastSubmissionId);

  if (!submission) {
    alert('Không tìm thấy dữ liệu kết quả!');
    window.location.href = 'student-dashboard.html';
    return;
  }

  // 3. Load associated exam
  const exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];
  const exam = exams.find(e => e.id === submission.examId);

  if (!exam) {
    alert('Không tìm thấy thông tin kỳ thi gốc!');
    window.location.href = 'student-dashboard.html';
    return;
  }

  // 4. Update Header & User Info
  document.getElementById('studentName').textContent = currentUser.name || currentUser.username;
  document.getElementById('examTitleDisplay').textContent = `Kết quả bài thi: ${submission.examTitle}`;

  // 4a. Button Event Listeners
  const btnHome = document.getElementById('btnHome');
  if (btnHome) {
    btnHome.addEventListener('click', () => {
      window.location.href = 'student-dashboard.html';
    });
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('quiz_current_user');
      window.location.href = 'login.html';
    });
  }

  // 5. Update Score Summary Card
  document.getElementById('scoreDisplay').innerHTML = `${submission.score.toFixed(1)} <span class="text-2xl text-slate-400 font-medium">/ 10 Điểm</span>`;
  document.getElementById('correctCountDisplay').textContent = `${submission.correctAnswers} / ${submission.totalQuestions}`;
  const incorrectCount = submission.totalQuestions - submission.correctAnswers;
  document.getElementById('incorrectCountDisplay').textContent = `${incorrectCount} / ${submission.totalQuestions}`;
  document.getElementById('timeSpentDisplay').textContent = submission.timeSpent || '--';

  // 6. Render Detailed Review
  const reviewContainer = document.getElementById('reviewContainer');

  if (!reviewContainer) return;

  let reviewHtml = '';

  const labels = ['A', 'B', 'C', 'D'];

  exam.questions.forEach((q, index) => {
    let selectedOptIndex = -1;
    if (submission.answers) {
      let studentAns = submission.answers.find(a => a.questionId === q.id);
      if (studentAns) selectedOptIndex = studentAns.selectedOption;
    } else if (submission.userAnswers) {
      selectedOptIndex = submission.userAnswers[index] !== null && submission.userAnswers[index] !== undefined ? submission.userAnswers[index] : -1;
    }
    const isCorrect = selectedOptIndex === q.correctOption;
    const isUnanswered = selectedOptIndex === -1;

    let statusBadge = isCorrect
      ? `<span class="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check</span> Chấm đúng</span>`
      : (isUnanswered
        ? `<span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1 border border-amber-200"><span class="material-symbols-outlined text-[14px]">horizontal_rule</span> Chưa chọn đáp án</span>`
        : `<span class="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">close</span> Chọn sai</span>`);

    let optionsHtml = '';
    q.options.forEach((opt, optIndex) => {
      let optBg = 'bg-slate-50 border-slate-200 text-slate-600';
      let checkIcon = '';
      let labelText = opt;

      if (optIndex === q.correctOption) {
        optBg = 'bg-emerald-500 text-white border-emerald-500 font-medium'; // Correct answer is solid green
        checkIcon = '<span class="material-symbols-outlined text-[16px]">done</span>';
        if (optIndex === selectedOptIndex) {
          labelText += ' <span class="ml-1 text-emerald-100 text-xs">(Đã chọn)</span>';
        }
      } else if (optIndex === selectedOptIndex) {
        optBg = 'bg-red-50 text-red-700 border-red-200 font-medium'; // User's wrong answer is light red
        checkIcon = '<span class="material-symbols-outlined text-[16px] text-red-500">close</span>';
        labelText += ' <span class="ml-1 opacity-70 text-xs">(Đã chọn)</span>';
      }

      optionsHtml += `
            <div class="px-4 py-3 rounded-lg border ${optBg} flex items-center justify-between text-sm transition-colors">
                <span><span class="font-bold mr-2">${labels[optIndex]}.</span> ${labelText}</span>
                ${checkIcon}
            </div>
        `;
    });

    let textClass = isUnanswered ? 'text-amber-700' : 'text-slate-800';
    let borderColor = isCorrect ? 'border-slate-100' : (isUnanswered ? 'border-amber-200' : 'border-error/20');
    let bgColor = isCorrect ? 'bg-white' : (isUnanswered ? 'bg-amber-50/30' : 'bg-error/5');

    reviewHtml += `
            <div id="q${index}" class="${bgColor} p-6 rounded-xl border ${borderColor} shadow-sm scroll-mt-24">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-sm font-bold text-slate-400 uppercase">Câu hỏi ${index + 1}</span>
                    ${statusBadge}
                </div>
                <p class="${textClass} font-medium mb-6 leading-relaxed">${q.text}</p>
                <div class="space-y-2">
                    ${optionsHtml}
                </div>
            </div>
        `;
  });

  reviewContainer.innerHTML = reviewHtml;

});
