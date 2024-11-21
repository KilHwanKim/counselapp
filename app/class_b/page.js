import ClassGrid from "./classgrid";
import { connectDB } from "@/util/database";

export default async function Home() {
  //db 정보 가져오기
  let db = (await connectDB).db('counsel')
  //학생 조회
  let userList = await db.collection('user').find().toArray();
  // 수업 조회
  let classList = await db.collection('class').find().toArray();

  return (
    <main className="p-4">
      <ClassGrid  userList={userList} classList={classList}/>
    </main>
  );
}
