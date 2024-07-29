// components/Navbar.js
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link href="/user" className="text-white hover:text-gray-400">
            사용자 관리
          </Link>
        </li>
        <li>
          <Link href="/page1" className="text-white hover:text-gray-400">
            일정 관리
          </Link>
        </li>
        <li>
          <Link href="/page2" className="text-white hover:text-gray-400">
            수업 관리
          </Link>
        </li>
        <li>
          <Link href="/page3" className="text-white hover:text-gray-400">
            문자 발송 관리
          </Link>
        </li>
        <li>
          <Link href="/page4" className="text-white hover:text-gray-400">
            문자 이력 관리
          </Link>
        </li>
      </ul>
    </nav>
  );
}
