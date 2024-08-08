import { connectDB } from "@/util/database"
import { ObjectId } from "mongodb";

export default async function handler(요청, 응답) {
    
    if (요청.method == 'POST'){
      console.log("왔어요")
      console.log(요청.body);
      응답.status(200).json({ message: '데이터 저장 성공' });  
  }
}