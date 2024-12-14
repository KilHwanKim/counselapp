import React from 'react';
import UserTable from './userTable'; // UserTable 컴포넌트 경로
import { connectDB } from "/util/database.js"
const db = (await connectDB).db('counsel');
let userData = await db.collection('user').find().toArray();
userData = userData.map((a)=>{
    a._id = a._id.toString()
    return a
  })
const UsersPage = () => {
    
    // const userData = [
    //     {
    //       "id": 1,
    //       "name": "홍길동",
    //       "parentPhone": "010-1234-5678",
    //       "birthday": "2010-05-01",
    //       "notes": "알레르기 있음",
    //       "status": "original"
    //     },
    //     {
    //       "id": 2,
    //       "name": "김철수",
    //       "parentPhone": "010-8765-4321",
    //       "birthday": "2012-09-15",
    //       "notes": "특이사항 없음",
    //       "status": "original"
    //     },
    //     {
    //       "id": 3,
    //       "name": "박영희",
    //       "parentPhone": "010-1111-2222",
    //       "birthday": "2011-12-25",
    //       "notes": "시력 교정 필요",
    //       "status": "original"
    //     }
    //   ]
      
    return (
        <div className="container mx-auto p-4">
            <UserTable  data={userData}/>
        </div>
    );
};

export default UsersPage;
