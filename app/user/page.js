import React from 'react';
import UserTable from './userTable'; // UserTable 컴포넌트 경로
import { connectDB } from "/util/database.js"



export default async function Home() {
    const db = (await connectDB).db('counsel');
    let userData = await db.collection('user').find().toArray();
    console.log(userData);
    userData = userData.map((a) => {
        a._id = a._id.toString()
        return a
    })
    
    return (
        <div className="container mx-auto p-4">
            <UserTable data={userData} />
        </div>
    );
}