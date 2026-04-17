'use client';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">📊 Панель управления</h1>
      <p className="text-gray-600 mt-2">Демо MVP — обход оборудования в реальном времени</p>
      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="bg-white p-6 rounded border">
          <div className="text-sm text-gray-500">Обходов сегодня</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="bg-white p-6 rounded border">
          <div className="text-sm text-gray-500">Активные неисправности</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="bg-white p-6 rounded border">
          <div className="text-sm text-gray-500">Рабочих на смене</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="bg-white p-6 rounded border">
          <div className="text-sm text-gray-500">Здоровье оборудования</div>
          <div className="text-2xl font-bold">—%</div>
        </div>
      </div>
    </div>
  );
}
