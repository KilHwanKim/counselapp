import { connectDB } from "@/util/database"
import { ObjectId } from "mongodb";

export default async function handler(요청, 응답) {
    
    if (요청.method == 'POST'){
      const data = 요청.body;
      
      try{
        for (const row of data) {
          if(row.status == "insert"){
            console.log("추가")
          }
          else if (row.status == "normal"){
            console.log("수정")
          }
        }
      }
      catch{
        console.error('DB 작업 중 오류 발생:', error);
      }
      응답.status(200).json({ message: '데이터 저장 성공' });  
  }
}