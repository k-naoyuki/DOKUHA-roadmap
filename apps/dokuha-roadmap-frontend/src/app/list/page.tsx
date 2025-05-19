'use client'
import { useEffect, useState } from "react";

interface user {
  id:string;
  nickname:string;
  email:string;
  readingMission:string;
  createdAt:string;
  updatedAt:string;
}

export default function list(){

  const [users, setUsers] = useState<user[]>([]);

  useEffect(()=>{
    const fetchUsers = async () => {
      const db = await fetch('http://localhost:8787/users');
      const data = await db.json();
      setUsers(data);
      console.log(users);
    };
    fetchUsers();
  }, [])

  const makeList=()=>{
    return (
      <ul>
        {users.map((user)=>{
          return (
            <li key={user.id}>
              {user.nickname}
            </li>
          )
        })}
        <li>test</li>
      </ul>
    );
  }

  return (
    <div>
      <h1>test</h1>
      {makeList()}
    </div>
  );

}