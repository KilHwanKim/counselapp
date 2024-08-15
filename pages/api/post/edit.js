import { connectDB } from "@/util/database"
import { ObjectId } from "mongodb";


export default async function handler(요청, 응답) {

  //db 정보 세팅 
  const db = (await connectDB).db('counsel');
  
  
  //insert 와 update 처리 
  if (요청.method == 'POST') {
    const data = 요청.body;

    try {
      for (const row of data) {
        if (row.status == "insert") {
          console.log("추가")
        }
        else if (row.status == "normal") {
          console.log("수정");
          console.log(row);
          console.log(row.id);
          const result = await db.collection('user').updateOne({ _id: new ObjectId(row.id) }, 
          { $set: { 
            name:row.name
            ,phoneNumber:row.phoneNumber
            ,birth:row.birth
          } });
        }
      }
    }
    catch {
      console.error('DB 작업 중 오류 발생:', error);
    }
    응답.status(200).json({ message: '데이터 저장 성공' });
  }
  else if (요청.method == 'DELETE') {
    console.log("삭제 함수 구현 예정")

  }
}