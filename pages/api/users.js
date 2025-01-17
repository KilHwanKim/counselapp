// pages/api/users.js
import { connectDB } from "/util/database.js";
import { ObjectId } from "mongodb";
const db = (await connectDB).db('counsel');
let users = [];

export default async function handler(req, res) {
    if (req.method === "GET") {
        // GET 요청: 사용자 목록 반환

        res.status(200).json(users);
    } else if (req.method === "POST") {

        // POST 요청: 사용자 데이터 업데이트
        const updatedUsers = req.body;
        // 상태별로 데이터 처리
        updatedUsers.forEach((user) => {
            if (user.status === "new") {
                // 새로운 사용자 추가
                user.status = "normal";
                db.collection('user').insertOne(user);
            } else if (user.status === "modified") {

                // 기존 사용자 수정
                db.collection('user').updateOne({ _id: new ObjectId(user._id) }, {
                    $set: {
                        name: user.name
                        , parentPhone: user.parentPhone
                        , birthday : user.birthday
                        , notes : user.notes
                        , status : "normal"
                    }
                });
            } else if (user.status === "deleted") {
                // 사용자 삭제
                db.collection('user').deleteOne({ _id: { $gte: new ObjectId(user._id) } });
            }
        });

        res.status(200).json({ message: "데이터가 성공적으로 저장되었습니다." });
    } else {
        // 다른 요청은 허용하지 않음
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
