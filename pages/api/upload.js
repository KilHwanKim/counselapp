import multer from 'multer';
import fs from 'fs';
import xlsx from 'xlsx';

const upload = multer({ dest: 'uploads/' });

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

        // 업로드된 파일 삭제
        fs.unlinkSync(filePath);
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
