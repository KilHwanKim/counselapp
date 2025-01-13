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
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Email', key: 'email', width: 40 },
            ];
            data.forEach(user => worksheet.addRow(user));
        } else if (type === "course") {
            console.log("Course data received:", data);
            worksheet.columns = [
                { header: 'Course ID', key: 'id', width: 10 },
                { header: 'Course Name', key: 'name', width: 30 },
                { header: 'Description', key: 'description', width: 50 },
            ];
            data.forEach(course => worksheet.addRow(course));
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
