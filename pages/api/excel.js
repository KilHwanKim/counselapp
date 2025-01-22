export default async function handler(req, res) {
    const ExcelJS = require('exceljs');

    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { type, data } = req.body;

    try {
        // 워크북 생성
        const workbook = new ExcelJS.Workbook();
        console.log(workbook);
        const worksheet = workbook.addWorksheet('Sheet1');

        // 데이터 추가: 요청 유형에 따라 처리
        if (type === "user") {
            console.log("User data received:", data);
            worksheet.columns = [
                { header: '이름', key: 'name', width: 30 },
                { header: '부모 전화번호', key: 'phoneNumber', width: 30 },
                { header: '생년월일', key: 'birth', width: 40 },
                { header: '생활연령(수정X)', key: 'age', width: 40 },
                { header: '비고', key: 'note', width: 40 },
            ];
            data.forEach(user => worksheet.addRow(user));
        } else if (type === "course") {
            console.log("미구현")
        } else {
            return res.status(400).json({ message: "Invalid type" });
        }

        // 파일을 클라이언트로 스트리밍
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${type}_data.xlsx`
        );

        // Excel 데이터 전송
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error handling request:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
