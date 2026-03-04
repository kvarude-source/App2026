// นำเข้า Firebase modules จาก CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Firebase Configuration ของคุณ
const firebaseConfig = {
    apiKey: "AIzaSyBUhEHHnDX0CHJHPc-p-yXY8LHj8kTQb7w",
    authDomain: "varutapp.firebaseapp.com",
    projectId: "varutapp",
    storageBucket: "varutapp.firebasestorage.app",
    messagingSenderId: "525968755144",
    appId: "1:525968755144:web:6d330dd5acbc63208698fd",
    measurementId: "G-V3JG0SJQPT"
};

// เริ่มต้นใช้งาน Firebase และ Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// อ้างอิง Elements ต่างๆ ใน HTML
const form = document.getElementById('ncdForm');
const resultArea = document.getElementById('resultArea');
const resultText = document.getElementById('resultText');
const submitBtn = document.getElementById('submitBtn');

// ฟังก์ชันจำลองการทำนายความเสี่ยง NCDs
function calculateNCDRisk(weight, height, bp, sugar) {
    let riskLevel = "ปกติ";
    let issues = [];

    // คำนวณ BMI (น้ำหนัก / ส่วนสูงเป็นเมตรยกกำลังสอง)
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    if (bmi >= 25) issues.push("เสี่ยงโรคอ้วน (BMI สูง)");
    if (bp >= 140) issues.push("เสี่ยงความดันโลหิตสูง");
    if (sugar >= 126) issues.push("เสี่ยงโรคเบาหวาน");

    if (issues.length > 0) {
        riskLevel = "มีความเสี่ยง: " + issues.join(", ");
    } else {
        riskLevel = "ความเสี่ยงต่ำ: สุขภาพโดยรวมอยู่ในเกณฑ์ดี";
    }

    return { bmi: bmi.toFixed(2), riskLevel, issuesCount: issues.length };
}

// เมื่อกด Submit ฟอร์ม
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าเว็บ

    // เปลี่ยนข้อความปุ่มระหว่างโหลด
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "กำลังประมวลผลและบันทึก...";
    submitBtn.disabled = true;

    // ดึงค่าจากฟอร์ม
    const name = document.getElementById('name').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const bp = parseFloat(document.getElementById('bloodPressure').value);
    const sugar = parseFloat(document.getElementById('bloodSugar').value);

    // ประเมินความเสี่ยง
    const assessment = calculateNCDRisk(weight, height, bp, sugar);

    try {
        // บันทึกข้อมูลลง Firestore ใน Collection ชื่อ "ncd_predictions"
        const docRef = await addDoc(collection(db, "ncd_predictions"), {
            name: name,
            weight: weight,
            height: height,
            bloodPressure: bp,
            bloodSugar: sugar,
            bmi: assessment.bmi,
            riskResult: assessment.riskLevel,
            timestamp: new Date()
        });

        // แสดงผลลัพธ์บนหน้าจอ
        resultText.innerHTML = `
            <strong>คุณ ${name}</strong><br>
            ค่า BMI ของคุณคือ: ${assessment.bmi}<br>
            <strong>ผลการประเมิน:</strong> ${assessment.riskLevel}<br>
            <span style="font-size: 0.8em; color: gray;">(บันทึกข้อมูลสำเร็จ ID: ${docRef.id})</span>
        `;
        resultArea.classList.remove('hidden');
        form.reset(); // ล้างข้อมูลในฟอร์ม

    } catch (error) {
        console.error("Error adding document: ", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    } finally {
        // คืนค่าปุ่มกลับมาเหมือนเดิม
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
});
