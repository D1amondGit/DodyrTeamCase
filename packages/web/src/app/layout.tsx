import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Мобильный Обходчик',
  description: 'Система автоматизации обхода оборудования',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
