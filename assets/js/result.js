document.addEventListener('DOMContentLoaded', () => {
  // 1. Check Auth
  const currentUser = JSON.parse(sessionStorage.getItem('quiz_current_user'));
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

  // 5. Update Score Summary Card
  document.getElementById('scoreDisplay').innerHTML = `${submission.score.toFixed(1)} <span class="text-2xl text-slate-400 font-medium">/ 10 Điểm</span>`;
  document.getElementById('correctCountDisplay').textContent = `${submission.correctAnswers} / ${submission.totalQuestions}`;
  const incorrectCount = submission.totalQuestions - submission.correctAnswers;
  document.getElementById('incorrectCountDisplay').textContent = `${incorrectCount} / ${submission.totalQuestions}`;
  document.getElementById('timeSpentDisplay').textContent = submission.timeSpent || '--';

  // 6. Render Detailed Review
  const reviewContainer = document.getElementById('reviewContainer');
  const paletteContainer = document.getElementById('reviewPalette');

  if (!reviewContainer || !paletteContainer) return;

  let reviewHtml = '';
  let paletteHtml = '';

  const labels = ['A', 'B', 'C', 'D'];
  const userAnswers = submission.userAnswers || [];

  exam.questions.forEach((q, index) => {
    const uAns = userAnswers[index];
    const isCorrect = uAns === q.correctOption;
    const isUnanswered = uAns === null || uAns === undefined;

    // --- Palette Button ---
    let badgeColor = isCorrect ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20';
    if (isUnanswered) badgeColor = 'bg-slate-100 text-slate-500 border-slate-200';

    paletteHtml += `
            <a href="#q${index}" class="aspect-square flex items-center justify-center rounded-lg text-sm font-bold border transition-colors ${badgeColor}">
                ${index + 1}
            </a>
        `;

    // --- Question Detail Block ---
    let statusBadge = isCorrect
      ? `<span class="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check</span> Chính xác</span>`
      : (isUnanswered
        ? `<span class="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">horizontal_rule</span> Bỏ qua</span>`
        : `<span class="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">close</span> Sai</span>`);

    let optionsHtml = '';
    q.options.forEach((opt, optIndex) => {
      const isUserChoice = uAns === optIndex;
      const isActuallyCorrect = q.correctOption === optIndex;

      let optClass = 'p-4 rounded-lg border border-slate-200 flex items-center gap-3';
      let iconHtml = '';
      let letterClass = 'size-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-400';
      let textClass = 'text-slate-600';

      if (isActuallyCorrect) {
        // The correct answer (always highlight green)
        optClass = 'p-4 rounded-lg border-2 border-success bg-white flex items-center justify-between';
        letterClass = 'size-6 rounded-full bg-success flex items-center justify-center text-xs font-bold text-white';
        textClass = 'text-slate-900 font-semibold';
        iconHtml = `<span class="material-symbols-outlined text-success">verified</span>`;
        if (isUserChoice) {
          optClass = 'p-4 rounded-lg border-2 border-success bg-success/5 flex items-center justify-between';
          iconHtml = `<span class="material-symbols-outlined text-success">check_circle</span>`;
        }
      } else if (isUserChoice && !isActuallyCorrect) {
        // User chose this, but it's wrong (highlight red)
        optClass = 'p-4 rounded-lg border-2 border-error bg-error/5 flex items-center justify-between';
        letterClass = 'size-6 rounded-full bg-error flex items-center justify-center text-xs font-bold text-white';
        textClass = 'text-slate-900 font-semibold';
        iconHtml = `<span class="material-symbols-outlined text-error">cancel</span>`;
      }

      optionsHtml += `
                <div class="${optClass}">
                    <div class="flex items-center gap-3">
                        <div class="${letterClass}">${labels[optIndex]}</div>
                        <span class="${textClass}">${opt} ${isActuallyCorrect && isUserChoice ? '(Đáp án đúng)' : ''}</span>
                    </div>
                    ${iconHtml}
                </div>
            `;
    });

    reviewHtml += `
            <div id="q${index}" class="bg-white p-6 rounded-xl border border-slate-100 shadow-sm scroll-mt-24">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-sm font-bold text-slate-400 uppercase">Câu hỏi ${index + 1}</span>
                    ${statusBadge}
                </div>
                <p class="text-slate-800 font-medium mb-6">${q.text}</p>
                <div class="grid gap-3">
                    ${optionsHtml}
                </div>
            </div>
        `;
  });

  reviewContainer.innerHTML = reviewHtml;
  paletteContainer.innerHTML = paletteHtml;

});
