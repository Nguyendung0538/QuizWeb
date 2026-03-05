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

  if (saveBtnTop) saveBtnTop.addEventListener('click', saveExam);
  if (saveBtnBottom) saveBtnBottom.addEventListener('click', saveExam);

  const examStartTime = document.getElementById('examStartTime');
  const examEndTime = document.getElementById('examEndTime');

  if (examStartTime && examEndTime) {
    examStartTime.addEventListener('change', () => {
      examEndTime.min = examStartTime.value;
      if (examEndTime.value && new Date(examEndTime.value) <= new Date(examStartTime.value)) {
        examEndTime.value = '';
      }
    });

    examEndTime.addEventListener('change', () => {
      if (examStartTime.value && new Date(examEndTime.value) <= new Date(examStartTime.value)) {
        showCustomAlert('Thời gian kết thúc phải sau thời gian bắt đầu!');
        examEndTime.value = '';
      }
    });
  }

  // Custom Alert Modal logic
  const customAlertModal = document.getElementById('customAlertModal');
  const customAlertModalOverlay = document.getElementById('customAlertModalOverlay');
  const customAlertModalContent = document.getElementById('customAlertModalContent');
  const customAlertMessage = document.getElementById('customAlertMessage');

  document.querySelectorAll('.custom-alert-close').forEach(btn => {
    btn.addEventListener('click', closeCustomAlert);
  });

  window.showCustomAlert = function (msg) {
    if (!customAlertModal) {
      alert(msg); // fallback
      return;
    }
    customAlertMessage.textContent = msg;
    customAlertModal.classList.remove('hidden');
    void customAlertModal.offsetWidth;
    customAlertModalOverlay.classList.remove('opacity-0');
    customAlertModalContent.classList.remove('opacity-0', 'scale-95');
    customAlertModalContent.classList.add('scale-100');
  };

  function closeCustomAlert() {
    if (!customAlertModal) return;
    customAlertModalOverlay.classList.add('opacity-0');
    customAlertModalContent.classList.remove('scale-100');
    customAlertModalContent.classList.add('opacity-0', 'scale-95');
    setTimeout(() => customAlertModal.classList.add('hidden'), 300);
  }

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
      showCustomAlert('Vui lòng điền đầy đủ Thông tin chung của kỳ thi!');
      return;
    }

    if (!isPermanent) {
      if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
        showCustomAlert('Thời gian kết thúc phải sau thời gian bắt đầu!');
        return;
      }
    }

    const questionBlocks = document.querySelectorAll('.question-block');
    if (questionBlocks.length === 0) {
      showCustomAlert('Cần có ít nhất 1 câu hỏi trong kỳ thi!');
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
      showCustomAlert('Vui lòng điền đầy đủ đáp án và chọn câu đúng cho tất cả câu hỏi!');
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

  // --- Excel Import Logic ---
  const importExcelBtn = document.getElementById('importExcelBtn');
  const excelFileInput = document.getElementById('excelFileInput');
  const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');

  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener('click', () => {
      const templateData = [
        ['Câu hỏi', 'Phương án A', 'Phương án B', 'Phương án C', 'Phương án D', 'Đáp án đúng (A/B/C/D)'],
        ['1+1 bằng mấy?', '1', '2', '3', '4', 'B'],
        ['Thủ đô của Việt Nam là?', 'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Huế', 'A']
      ];
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'Mau_Cau_Hoi.xlsx');
    });
  }

  if (importExcelBtn && excelFileInput) {
    importExcelBtn.addEventListener('click', () => {
      excelFileInput.click();
    });

    excelFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Assuming header in first row, start from index 1
          // Format: [Question, Option A, Option B, Option C, Option D, Correct (A/B/C/D)]
          let importedCount = 0;
          jsonData.slice(1).forEach(row => {
            if (row.length >= 6) {
              const questionText = row[0];
              const options = [row[1], row[2], row[3], row[4]];
              const correctStr = String(row[5]).trim().toUpperCase();
              
              let correctOption = 0;
              if (correctStr === 'A' || correctStr === '1') correctOption = 0;
              else if (correctStr === 'B' || correctStr === '2') correctOption = 1;
              else if (correctStr === 'C' || correctStr === '3') correctOption = 2;
              else if (correctStr === 'D' || correctStr === '4') correctOption = 3;

              addQuestionBlock({
                text: questionText,
                options: options,
                correctOption: correctOption
              });
              importedCount++;
            }
          });

          if (importedCount > 0) {
            showCustomAlert(`Đã nhập thành công ${importedCount} câu hỏi từ Excel!`);
          } else {
            showCustomAlert('Không tìm thấy câu hỏi hợp lệ trong file Excel. Vui lòng kiểm tra lại định dạng!');
          }
        } catch (error) {
          console.error('Error reading excel:', error);
          showCustomAlert('Lỗi khi đọc file Excel. Vui lòng thử lại!');
        }
        // Reset input to allow selecting same file again
        excelFileInput.value = '';
      };
      reader.readAsArrayBuffer(file);
    });
  }
});
