import Table from "./table";
export default function UserMng() {
  const header = ['ID', 'Name', 'Email'];
  const items = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' },
  ];
  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <Table header={header} items={items} />
    </main>
  );
}
