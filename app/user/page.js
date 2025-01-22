import React from 'react';
import UserTable from './userTable'; // UserTable 컴포넌트 경로
import { connectDB } from "/util/database.js"



export default async function Home() {
    const db = (await connectDB).db('counsel');
    let userData = await db.collection('user').find().toArray();
    
    //나이 계산 함수
    const calculateAge = (birthDateString) =>{
    
        if (!birthDateString) return "";

        const today = new Date();
        const birthDate = new Date(birthDateString);

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        const todayDate = today.getDate();
        const birthDateDay = birthDate.getDate();
        if (todayDate < birthDateDay) {
            months--;
            if (months < 0) {
                years--;
                months += 12;
            }
        }

        return `${years}년 ${months}개월`;
    };



    userData = userData.map((a) => {
        a._id = a._id.toString()
        a.age = calculateAge(a.birth)
        return a
    })
    
    return (
        <div className="container mx-auto p-4">
            <UserTable data={userData} />
        </div>
    );
}