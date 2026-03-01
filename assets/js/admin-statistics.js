document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Mock Submissions if not exists
  if (!localStorage.getItem('quiz_submissions')) {
    const mockSubmissions = [
      { id: 1, studentId: 1, studentEmail: 'nva.b20dccn001@stu.ptit.edu.vn', studentName: 'Nguyễn Văn A', examId: 'EXAM_1', examTitle: 'Kiểm tra Giữa kỳ Mạng Máy Tính', score: 9.5, timeSpent: '42 phút 15s', submittedAt: '10:45 AM, 12/10/2023' },
      { id: 2, studentId: 2, studentEmail: 'ttb.b20dccn002@stu.ptit.edu.vn', studentName: 'Trần Thị B', examId: 'EXAM_2', examTitle: 'Thi Cuối kỳ Cấu trúc Dữ liệu', score: 10.0, timeSpent: '55 phút 02s', submittedAt: '09:15 AM, 12/10/2023' },
      { id: 3, studentId: 3, studentEmail: 'lvc.b20dccn045@stu.ptit.edu.vn', studentName: 'Lê Văn C', examId: 'EXAM_1', examTitle: 'Kiểm tra Giữa kỳ Mạng Máy Tính', score: 5.5, timeSpent: '58 phút 10s', submittedAt: '15:20 PM, 13/10/2023' }
    ];
    // Add more random mock data for the charts
    for (let i = 4; i <= 50; i++) {
      const rScore = +(Math.random() * 10).toFixed(1);
      mockSubmissions.push({
        id: i,
        studentName: `Sinh viên ảo ${i}`,
        examTitle: 'Luyện tập Lập trình C++',
        score: rScore,
        timeSpent: '30 phút 00s',
        submittedAt: '10:00 AM, 15/10/2023'
      });
    }
    localStorage.setItem('quiz_submissions', JSON.stringify(mockSubmissions));
  }

  renderStatistics();
});

function renderStatistics() {
  const submissions = JSON.parse(localStorage.getItem('quiz_submissions')) || [];
  const users = JSON.parse(localStorage.getItem('quiz_users')) || [];
  const students = users.filter(u => u.role !== 'admin' && u.username !== 'admin');

  const totalSubmissions = submissions.length;
  let totalScore = 0;
  submissions.forEach(sub => totalScore += sub.score);
  const avgScore = totalSubmissions > 0 ? (totalScore / totalSubmissions).toFixed(1) : 0;

  // Update Overview Cards
  document.getElementById('totalSubmissionsCount').textContent = totalSubmissions.toLocaleString();
  document.getElementById('avgScoreText').textContent = avgScore;
  document.getElementById('avgScoreSubtext').textContent = `Dựa trên ${totalSubmissions.toLocaleString()} bài thi`;

  // Render Recent History Table (Top 5)
  const historyBody = document.getElementById('recentHistoryTableBody');
  if (historyBody) {
    const recent = [...submissions].sort((a, b) => b.id - a.id).slice(0, 5);
    let html = '';
    recent.forEach(sub => {
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
                    <td class="px-6 py-4 text-right">
                        <span class="inline-flex items-center justify-center px-2 py-1 ${sub.score >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} font-bold rounded text-sm">${sub.score.toFixed(1)}</span>
                    </td>
                </tr>
            `;
    });
    if (recent.length === 0) {
      html = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>';
    }
    historyBody.innerHTML = html;
  }

  // Chart logic
  renderCharts(submissions, students);
}

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
    new Chart(ctxBar, {
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
  submissions.forEach(sub => {
    const s = sub.score;
    if (s >= 8.5) grades[0]++;
    else if (s >= 7.0) grades[1]++;
    else if (s >= 5.0) grades[2]++;
    else grades[3]++;
  });

  document.getElementById('totalStudentsChartCount').textContent = students.length.toLocaleString();

  const ctxDoughnut = document.getElementById('gradeDoughnut')?.getContext('2d');
  if (ctxDoughnut) {
    new Chart(ctxDoughnut, {
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
