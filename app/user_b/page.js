import React from 'react';
import { connectDB } from "@/util/database";
import UserGrid from "./usergrid";

import FullFeaturedCrudGrid from "./gridsample";
export default async function UserMng() {
  //db에서 전체 학생 조회
  let db = (await connectDB).db('counsel')
  let userList = await db.collection('user').find().toArray();
  //id 변경
  userList = userList.map((a)=>{
  //그리드 성질상 id 칼럼이 있어야 동작
  a.id=a._id.toString();
  a._id=a._id.toString();
  //x grid 성질때문에 DATE 으로 바꿔야함
  a.birth=new Date(a.birth);
  a.status="normal"
      return a
  })
  console.log(userList)
  return (
    <main className="p-4">
      <UserGrid userList={userList}></UserGrid>
      {/* <FullFeaturedCrudGrid userList={userList}></FullFeaturedCrudGrid> */}
  </main>
  );
}
