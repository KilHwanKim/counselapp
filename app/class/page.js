import { connectDB } from "@/util/database";
import Image from "next/image";

export default async function Home() {
  //db에서 전체 학생 조회
  let db = (await connectDB).db('counsel')
  let result = await db.collection('user').find().toArray();
  //id 변경
  result = result.map((a)=>{
    a._id = a._id.toString()
    return a
  })
  return (
    <main>
      
    </main>
  );
}
