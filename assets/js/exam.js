document.addEventListener('DOMContentLoaded', () => {
  // 1. Check Auth 
  const currentUser = JSON.parse(localStorage.getItem('quiz_current_user'));
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // 2. Extract Exam ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('id');

  if (!examId) {
    alert('Không tìm thấy mã kỳ thi!');
    window.location.href = 'student-dashboard.html';
    return;
  }

  // 3. Load Exam Data via API
  let exam = null;
  let questions = [];
  let currentQuestionIndex = 0;
  let answers = [];
  let timeRemaining = 0;
  let timerInterval = null;

  const titleEl = document.getElementById('examTitleHeader');
  const timerEl = document.getElementById('examTimer');
  const questionContainer = document.getElementById('questionContainer');
  const questionPalette = document.getElementById('questionPalette');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtns = document.querySelectorAll('.submit-exam-btn');
  const answeredCountEl = document.getElementById('answeredCount');

  // Modal Elements
  const confirmSubmitModal = document.getElementById('confirmSubmitModal');
  const confirmSubmitOverlay = document.getElementById('confirmSubmitOverlay');
  const confirmSubmitContent = document.getElementById('confirmSubmitContent');
  const confirmSubmitMessage = document.getElementById('confirmSubmitMessage');
  const cancelSubmitBtn = document.getElementById('cancelSubmitBtn');
  const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');

  initExam();

  async function initExam() {
      try {
          if(!window.API) {
              alert('Lỗi hệ thống: Chưa tải được thư viện API.');
              window.location.href = 'student-dashboard.html';
              return;
          }

          exam = await window.API.get(`/exams/${examId}/start`);
          
          if (!exam) {
            alert('Kỳ thi không tồn tại!');
            window.location.href = 'student-dashboard.html';
            return;
          }

          if (exam.status !== 'active') {
            alert('Kỳ thi này hiện chưa mở hoặc đã kết thúc.');
            window.location.href = 'student-dashboard.html';
            return;
          }

          questions = exam.questions || [];
          answers = new Array(questions.length).fill(null);
          timeRemaining = (exam.duration || 60) * 60; // Convert to seconds

          // Setup Header
          if (titleEl) titleEl.textContent = `Bài thi: ${exam.title}`;

          // Start Timer
          startTimer();

          // Render initial question and palette
          renderPalette();
          if (questions.length > 0) {
              renderQuestion(currentQuestionIndex);
          } else {
              if (questionContainer) questionContainer.innerHTML = '<p class="text-center text-slate-500 py-8">Kỳ thi này chưa có câu hỏi nào.</p>';
          }
          updateControls();

      } catch (error) {
          console.error("Lỗi khi tải đề thi:", error);
          alert('Không thể tải bài thi: ' + error.message);
          window.location.href = 'student-dashboard.html';
      }
  }


  // Event Listeners
  prevBtn?.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion(currentQuestionIndex);
      updateControls();
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      renderQuestion(currentQuestionIndex);
      updateControls();
    }
  });

  submitBtns.forEach(btn => btn.addEventListener('click', () => showConfirmModal(false)));

  if (cancelSubmitBtn) cancelSubmitBtn.addEventListener('click', hideConfirmModal);
  if (confirmSubmitBtn) confirmSubmitBtn.addEventListener('click', () => {
    hideConfirmModal();
    processSubmission();
  });

  function showConfirmModal(isAuto) {
    if (isAuto) {
      processSubmission();
      return;
    }
    const answeredCount = answers.filter(a => a !== null).length;
    if (answeredCount < questions.length) {
      confirmSubmitMessage.textContent = `Bạn mới làm ${answeredCount}/${questions.length} câu. Bạn có chắc chắn muốn nộp bài?`;
    } else {
      confirmSubmitMessage.textContent = 'Bạn đã hoàn thành tất cả câu hỏi. Bạn có muốn nộp bài ngay bây giờ?';
    }

    if (confirmSubmitModal) {
      confirmSubmitModal.classList.remove('hidden');
      void confirmSubmitModal.offsetWidth;
      confirmSubmitOverlay.classList.remove('opacity-0');
      confirmSubmitContent.classList.remove('opacity-0', 'scale-95');
      confirmSubmitContent.classList.add('scale-100');
    } else {
      // Fallback
      if (confirm(confirmSubmitMessage.textContent)) {
        processSubmission();
      }
    }
  }

  function hideConfirmModal() {
    if (!confirmSubmitModal) return;
    confirmSubmitOverlay.classList.add('opacity-0');
    confirmSubmitContent.classList.remove('scale-100');
    confirmSubmitContent.classList.add('opacity-0', 'scale-95');
    setTimeout(() => confirmSubmitModal.classList.add('hidden'), 300);
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    const updateDisplay = () => {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      if (timerEl) {
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    };

    updateDisplay();

    timerInterval = setInterval(() => {
      timeRemaining--;
      updateDisplay();

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        alert('Hết giờ làm bài! Hệ thống sẽ tự động nộp bài.');
        processSubmission();
      }
    }, 1000);
  }

  function renderPalette() {
    if (!questionPalette) return;

    let html = '';
    for (let i = 0; i < questions.length; i++) {
      const isAnswered = answers[i] !== null;
      const bgClass = isAnswered
        ? 'bg-primary/10 text-primary border-primary/20'
        : 'bg-white text-slate-600 border-slate-200 hover:border-primary';

      const activeClass = i === currentQuestionIndex ? 'ring-2 ring-primary ring-offset-1' : '';

      html += `
                <button onclick="goToQuestion(${i})" class="aspect-square flex items-center justify-center rounded-lg text-sm font-bold border transition-colors ${bgClass} ${activeClass}">
                    ${i + 1}
                </button>
            `;
    }
    questionPalette.innerHTML = html;
    if (answeredCountEl) {
      const answeredCount = answers.filter(a => a !== null).length;
      answeredCountEl.textContent = `Đã làm: ${answeredCount}/${questions.length}`;
    }
  }

  window.goToQuestion = function (index) {
    currentQuestionIndex = index;
    renderQuestion(currentQuestionIndex);
    updateControls();
    renderPalette();
  };

  function renderQuestion(index) {
    if (!questionContainer || !questions[index]) return;

    const q = questions[index];
    const selectedOption = answers[index];
    const labels = ['A', 'B', 'C', 'D'];

    let optionsHtml = '';
    const formattedOptions = [q.option_a, q.option_b, q.option_c, q.option_d];

    formattedOptions.forEach((opt, optIndex) => {
      const isChecked = selectedOption === optIndex;
      const borderClass = isChecked
        ? 'border-2 border-primary bg-primary/5'
        : 'border border-border-light dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800';

      const textClass = isChecked ? 'text-text-main dark:text-slate-100 font-medium' : 'text-slate-700 dark:text-slate-300';
      const radioClass = isChecked ? 'border-primary custom-radio' : 'border-slate-300';

      optionsHtml += `
                <label class="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${borderClass}">
                    <input class="w-5 h-5 text-primary focus:ring-primary ${radioClass}" name="q${index}" type="radio" value="${optIndex}" ${isChecked ? 'checked' : ''} onchange="selectAnswer(${index}, ${optIndex})" />
                    <span class="${textClass}">${labels[optIndex]}. ${opt}</span>
                </label>
            `;
    });

    questionContainer.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-bold text-text-main dark:text-slate-100">Câu ${index + 1}: ${q.text}</h3>
                <span class="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">1.0 điểm</span>
            </div>
            <div class="space-y-3">
                ${optionsHtml}
            </div>
        `;
  }

  window.selectAnswer = function (qIndex, optIndex) {
    answers[qIndex] = optIndex;
    renderPalette();
    renderQuestion(qIndex); // Re-render to update radio button visual styles
  };

  function updateControls() {
    if (prevBtn) {
      prevBtn.disabled = currentQuestionIndex === 0;
      prevBtn.style.opacity = currentQuestionIndex === 0 ? '0.5' : '1';
      prevBtn.style.cursor = currentQuestionIndex === 0 ? 'not-allowed' : 'pointer';
    }

    if (nextBtn) {
      if (currentQuestionIndex === questions.length - 1) {
        // If last question, change next to nothing or hide, but UI usually keeps it
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
        nextBtn.style.cursor = 'not-allowed';
      } else {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
      }
    }
  }

  async function processSubmission() {
    clearInterval(timerInterval);

    // Calculate time spent (Duration in seconds - time remaining)
    const timeSpent = ((exam.duration || 60) * 60) - timeRemaining;

    // Structure Answers for Backend (using camelCase to match backend expectations)
    const formattedAnswers = questions.map((q, index) => ({
      questionId: q.id,
      selectedOption: (answers[index] !== null && answers[index] !== undefined) ? answers[index] : -1
    }));

    try {
        if (!window.API) return;

        // Post to backend API
        const response = await window.API.post('/submissions', {
            examId: exam.id,
            timeSpent: timeSpent,
            answers: formattedAnswers
        });

        // Save submitted ID to session for the result page to fetch
        sessionStorage.setItem('last_submission_id', response.submissionId || response.insertId || response.id || (response.result ? response.result.id : null));

        // Redirect to result page
        window.location.href = 'result.html';
        
    } catch (error) {
        console.error("Lỗi khi nộp bài:", error);
        alert('Lỗi nộp bài: ' + error.message);
    }
  }
});
