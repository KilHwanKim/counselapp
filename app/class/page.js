import { connectDB } from "@/util/database";
import ClassGrid from "./classgrid";


export default async function Home() {
  //db에서 전체 학생 조회
  let db = (await connectDB).db('counsel')
  let userList = await db.collection('user').find().toArray();
  //id 변경
  userList = userList.map((a)=>{
    a.id=a._id.toString()
    return a
  })
  return (
    <main>
      <ClassGrid userList={userList}></ClassGrid>
    </main>
  );
}
