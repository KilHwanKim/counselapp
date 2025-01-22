import multer from 'multer';
import fs from 'fs';
import xlsx from 'xlsx';
import { connectDB } from "/util/database.js";

const upload = multer({ dest: 'uploads/' });
const excelDateToJSDate = (excelDate) => {
  // 입력 값이 숫자인지 확인
  if (typeof excelDate !== 'number' || excelDate <= 0) {
    return '형식오류';
  }

  const baseDate = new Date(1900, 0, 1); // 1900년 1월 1일 기준
  const jsDate = new Date(baseDate.getTime() + (excelDate - 2) * 86400000); // 날짜 계산

  // YYYY-MM-DD 형식으로 반환
  const year = jsDate.getFullYear();
  const month = String(jsDate.getMonth() + 1).padStart(2, '0'); // 월 (0부터 시작하므로 +1)
  const day = String(jsDate.getDate()).padStart(2, '0'); // 일

  return `${year}-${month}-${day}`;
};



export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const multerMiddleware = upload.single('file');
    multerMiddleware(req, {}, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'File upload failed' });
      }

      const filePath = req.file.path;
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log("jsonData>>>>>>>>>");
        console.log(jsonData);


        // 업로드된 파일 삭제
        fs.unlinkSync(filePath);
        //data 삭제 및 insrt 예정
        const db = (await connectDB).db('counsel');

        //전체 삭제
        const result = await db.collection('user').deleteMany({_id: {$nin : [1]}})
        for (const row of jsonData) {
          const StringDate = excelDateToJSDate(row["생년월일"]);


          const result = await db.collection('user').insertOne({
            name: row["이름"]
            , phoneNumber: row["부모 전화번호"]
            , birth: StringDate
          });
        }

        res.status(200).json({ success: true, data: jsonData });
      } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({ success: false, message: 'Error processing file' });
      }
    });
  } else {
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
