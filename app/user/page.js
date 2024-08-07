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
  a.id=a._id.toString()
  a._id=a._id.toString()
  a.status="normal"
      return a
  })
  return (
    <main className="p-4">
      {/* <UserGrid userList={userList}></UserGrid> */}
      <FullFeaturedCrudGrid></FullFeaturedCrudGrid>
  </main>
  );
}
