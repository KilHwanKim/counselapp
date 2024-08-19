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
          const idCheck = await db.collection('user').findOne({ id: row.id });
          console.log("idCheck : " + idCheck);
          if (idCheck) {
            console.log("겹쳐요")
          }
          else {
            const result = await db.collection('user').insertOne({
              name: row.name
              , phoneNumber: row.phoneNumber
              , birth: row.birth
            });

          }
        }
        else if (row.status == "normal") {

          const result = await db.collection('user').updateOne({ _id: new ObjectId(row.id) },
            {
              $set: {
                name: row.name
                , phoneNumber: row.phoneNumber
                , birth: row.birth
              }
            });
        }
      }
    }
    catch {
      console.error('DB 작업 중 오류 발생:', error);
    }
    응답.status(200).json({ message: '데이터 저장 성공' });
  }
  else if (요청.method == 'DELETE') {
    const data = 요청.body;

    try {
      for (const row of data) {
        //추가한 것은 서비스 호출 안함
        if (row.status == "insert") {

        }
        else if (row.status == "normal") {
          db.collection('user').deleteOne({ _id: new ObjectId(row._id) });
        }
      }
    }
    catch {
      console.error('DB 작업 중 오류 발생:', error);
    }
    응답.status(200).json({ message: '데이터 삭제 성공' });

  }
}