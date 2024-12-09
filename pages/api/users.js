// pages/api/users.js

let users = [
    {
      id: 1,
      name: "홍길동",
      parentPhone: "010-1234-5678",
      birthday: "2010-01-01",
      notes: "알러지 없음",
      status: "original",
    },
    {
      id: 2,
      name: "김영희",
      parentPhone: "010-2345-6789",
      birthday: "2012-05-15",
      notes: "장기 결석 경험",
      status: "original",
    },
    {
      id: 3,
      name: "이철수",
      parentPhone: "010-3456-7890",
      birthday: "2011-08-20",
      notes: "조부모와 함께 거주",
      status: "original",
    },
  ];
  
  export default function handler(req, res) {
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
          users.push({ ...user, status: "original" });
        } else if (user.status === "modified") {
          // 기존 사용자 수정
          users = users.map((u) =>
            u.id === user.id ? { ...user, status: "original" } : u
          );
        } else if (user.status === "deleted") {
          // 사용자 삭제
          users = users.filter((u) => u.id !== user.id);
        }
      });
  
      res.status(200).json({ message: "데이터가 성공적으로 저장되었습니다." });
    } else {
      // 다른 요청은 허용하지 않음
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
  