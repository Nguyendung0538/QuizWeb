document.addEventListener('DOMContentLoaded', () => {
  const questionsContainer = document.getElementById('questionsContainer');
  const addQuestionBtn = document.getElementById('addQuestionBtn');
  const saveBtnTop = document.getElementById('saveExamBtnTop');
  const saveBtnBottom = document.getElementById('saveExamBtnBottom');

  let questionCount = 0;

  // Retrieve Exam ID from URL if in Edit Mode
  const urlParams = new URLSearchParams(window.location.search);
  const editExamId = urlParams.get('id');

  if (editExamId) {
    document.querySelector('h2').textContent = 'Chỉnh sửa kỳ thi';
    loadExamData(editExamId);
  } else {
    // Start with 1 empty question in create mode
    addQuestionBlock();
  }

  addQuestionBtn.addEventListener('click', () => {
    addQuestionBlock();
  });

  saveBtnTop.addEventListener('click', saveExam);
  saveBtnBottom.addEventListener('click', saveExam);

  function addQuestionBlock(data = null) {
    questionCount++;
    const currentId = questionCount;

    const qText = data ? data.text : '';
    const optA = data ? data.options[0] : '';
    const optB = data ? data.options[1] : '';
    const optC = data ? data.options[2] : '';
    const optD = data ? data.options[3] : '';
    const correct = data ? data.correctOption : 0;

    const block = document.createElement('div');
    block.className = 'question-block p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative';
    block.id = `question_block_${currentId}`;

    block.innerHTML = `
            <button type="button" onclick="this.parentElement.remove(); updateQuestionNumbers();" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors">
                <span class="material-symbols-outlined">delete</span>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <span class="q-number flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">${document.querySelectorAll('.question-block').length + 1}</span>
                <input class="q-text flex-1 bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-0 transition-all font-semibold py-1 px-0" placeholder="Nhập nội dung câu hỏi..." type="text" value="${qText}" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-center gap-3">
                    <input class="q-correct w-5 h-5 text-primary focus:ring-primary border-slate-300 dark:bg-slate-950" name="correct_q${currentId}" type="radio" value="0" ${correct === 0 ? 'checked' : ''} />
                    <div class="relative flex-1">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary text-xs">A</span>
                        <input class="q-opt w-full pl-8 py-2 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950" placeholder="Phương án A" type="text" value="${optA}" />
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <input class="q-correct w-5 h-5 text-primary focus:ring-primary border-slate-300 dark:bg-slate-950" name="correct_q${currentId}" type="radio" value="1" ${correct === 1 ? 'checked' : ''} />
                    <div class="relative flex-1">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary text-xs">B</span>
                        <input class="q-opt w-full pl-8 py-2 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950" placeholder="Phương án B" type="text" value="${optB}" />
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <input class="q-correct w-5 h-5 text-primary focus:ring-primary border-slate-300 dark:bg-slate-950" name="correct_q${currentId}" type="radio" value="2" ${correct === 2 ? 'checked' : ''} />
                    <div class="relative flex-1">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary text-xs">C</span>
                        <input class="q-opt w-full pl-8 py-2 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950" placeholder="Phương án C" type="text" value="${optC}" />
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <input class="q-correct w-5 h-5 text-primary focus:ring-primary border-slate-300 dark:bg-slate-950" name="correct_q${currentId}" type="radio" value="3" ${correct === 3 ? 'checked' : ''} />
                    <div class="relative flex-1">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary text-xs">D</span>
                        <input class="q-opt w-full pl-8 py-2 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950" placeholder="Phương án D" type="text" value="${optD}" />
                    </div>
                </div>
            </div>
        `;

    questionsContainer.insertBefore(block, addQuestionBtn);
    updateQuestionNumbers();
  }

  function updateQuestionNumbers() {
    const blocks = document.querySelectorAll('.question-block');
    blocks.forEach((block, index) => {
      const numSpan = block.querySelector('.q-number');
      if (numSpan) numSpan.textContent = index + 1;
    });
  }

  function loadExamData(id) {
    const exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];
    const exam = exams.find(e => e.id === id);
    if (!exam) return;

    document.getElementById('examTitle').value = exam.title;
    document.getElementById('examType').value = exam.type;
    document.getElementById('examDuration').value = exam.duration || '';

    const isPermCheckbox = document.getElementById('examIsPermanent');
    if (isPermCheckbox) {
      isPermCheckbox.checked = exam.isPermanent !== false; // false -> uncheck, default true
      isPermCheckbox.dispatchEvent(new Event('change'));
    }

    if (exam.startTime) document.getElementById('examStartTime').value = exam.startTime;
    if (exam.endTime) document.getElementById('examEndTime').value = exam.endTime;

    if (exam.questions && exam.questions.length > 0) {
      exam.questions.forEach(q => addQuestionBlock(q));
    } else {
      addQuestionBlock();
    }
  }

  function saveExam() {
    const title = document.getElementById('examTitle').value.trim();
    const type = document.getElementById('examType').value;
    const duration = document.getElementById('examDuration').value;

    const isPermanent = document.getElementById('examIsPermanent') ? document.getElementById('examIsPermanent').checked : true;
    const startTime = document.getElementById('examStartTime') ? document.getElementById('examStartTime').value : '';
    const endTime = document.getElementById('examEndTime') ? document.getElementById('examEndTime').value : '';

    if (!title || !type || !duration) {
      alert('Vui lòng điền đầy đủ Thông tin chung của kỳ thi!');
      return;
    }

    const questionBlocks = document.querySelectorAll('.question-block');
    if (questionBlocks.length === 0) {
      alert('Cần có ít nhất 1 câu hỏi trong kỳ thi!');
      return;
    }

    const questions = [];
    let isValid = true;

    questionBlocks.forEach((block, index) => {
      const text = block.querySelector('.q-text').value.trim();
      const optsElements = block.querySelectorAll('.q-opt');
      const options = Array.from(optsElements).map(el => el.value.trim());
      const correctRadio = block.querySelector('.q-correct:checked');

      if (!text || options.some(opt => !opt) || !correctRadio) {
        isValid = false;
      }

      questions.push({
        id: index + 1,
        text: text,
        options: options,
        correctOption: correctRadio ? parseInt(correctRadio.value) : 0
      });
    });

    if (!isValid) {
      alert('Vui lòng điền đầy đủ đáp án và chọn câu đúng cho tất cả câu hỏi!');
      return;
    }

    const exams = JSON.parse(localStorage.getItem('quiz_exams')) || [];

    let examStatus = 'active';
    if (!isPermanent) {
      const now = new Date();
      if (!startTime || !endTime) {
        examStatus = 'closed';
      } else {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const diffMs = startDate - now;

        if (now > endDate) {
          examStatus = 'closed';
        } else if (now < startDate) {
          // upcoming if within 1 hour
          if (diffMs > 0 && diffMs <= 60 * 60 * 1000) {
            examStatus = 'upcoming';
          } else {
            examStatus = 'closed';
          }
        }
      }
    }

    if (editExamId) {
      // Update existing
      const index = exams.findIndex(e => e.id === editExamId);
      if (index > -1) {
        exams[index] = {
          ...exams[index],
          title, type, duration, isPermanent, startTime, endTime, status: examStatus, questions,
          questionsCount: questions.length
        };
      }
    } else {
      // Create new
      const newId = 'EXAM_' + Date.now();
      exams.push({
        id: newId,
        title, type, duration, isPermanent, startTime, endTime,
        status: examStatus,
        questionsCount: questions.length,
        questions
      });
    }

    localStorage.setItem('quiz_exams', JSON.stringify(exams));
    window.location.href = 'admin-dashboard.html';
  }
});
