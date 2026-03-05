const mockExams = [
    {
        id: "IT001",
        title: "Lập trình hướng đối tượng (OOP)",
        duration: 10,
        status: "active", // Đang mở
        type: "luyen-tap", // Để test bộ lọc "Luyện tập"
        questionsCount: 2, // Để hiển thị số câu ở Dashboard
        questions: [
            {
                id: "q1",
                text: "Trong Java, từ khóa nào dùng để kế thừa một lớp?",
                options: ["implements", "extends", "inherit", "using"],
                correctOption: 1,
                explanation: "Từ khóa 'extends' được dùng để thiết lập mối quan hệ kế thừa giữa các lớp."
            },
            {
                id: "q2",
                text: "Tính chất nào của OOP cho phép che giấu thông tin chi tiết của đối tượng?",
                options: ["Tính đa hình", "Tính kế thừa", "Tính đóng gói", "Tính trừu tượng"],
                correctOption: 2,
                explanation: "Tính đóng gói (Encapsulation) giúp bảo vệ dữ liệu bên trong lớp."
            }
        ]
    },
    {
        id: "IT002",
        title: "Mạng máy tính - Layer 2 & 3",
        duration: 15,
        status: "upcoming", // Trạng thái Sắp diễn ra
        type: "giua-ky", // Để test bộ lọc "Giữa kỳ"
        startTime: new Date(Date.now() + 60000).toISOString(), // Bắt đầu sau 1 phút nữa (để test Countdown)
        questionsCount: 3,
        questions: [
            {
                id: "m1",
                text: "Giao thức ICMP hoạt động ở tầng nào trong mô hình OSI?",
                options: ["Tầng liên kết dữ liệu", "Tầng mạng", "Tầng giao vận", "Tầng ứng dụng"],
                correctOption: 1
            },
            {
                id: "m2",
                text: "Địa chỉ MAC có độ dài bao nhiêu bit?",
                options: ["32 bit", "48 bit", "64 bit", "128 bit"],
                correctOption: 1
            },
            {
                id: "m3",
                text: "Thiết bị Switch hoạt động chính ở tầng nào?",
                options: ["Tầng vật lý", "Tầng liên kết dữ liệu", "Tầng mạng", "Tầng phiên"],
                correctOption: 1
            }
        ]
    },
    {
        id: "IT003",
        title: "Cơ sở dữ liệu - SQL cơ bản",
        duration: 20,
        status: "active",
        type: "cuoi-ky", // Để test bộ lọc "Cuối kỳ"
        questionsCount: 2,
        questions: [
            {
                id: "db1",
                text: "Để loại bỏ các bản ghi trùng lặp trong kết quả SELECT, ta dùng từ khóa nào?",
                options: ["UNIQUE", "DISTINCT", "DIFFERENT", "ONLY"],
                correctOption: 1
            },
            {
                id: "db2",
                text: "Mệnh đề nào dùng để lọc dữ liệu sau khi đã GROUP BY?",
                options: ["WHERE", "ORDER BY", "HAVING", "LIMIT"],
                correctOption: 2
            }
        ]
    },
    {
        id: "IT004",
        title: "Kiến trúc máy tính (Đã đóng)",
        duration: 45,
        status: "closed", // Test trạng thái bài thi đã kết thúc
        type: "cuoi-ky",
        questionsCount: 1,
        questions: [
            {
                id: "arc1",
                text: "Đơn vị nào điều khiển mọi hoạt động của máy tính?",
                options: ["ALU", "CU", "Register", "RAM"],
                correctOption: 1
            }
        ]
    }
];

// Thực thi lưu
localStorage.setItem('quiz_exams', JSON.stringify(mockExams));
