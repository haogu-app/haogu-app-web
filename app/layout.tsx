import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '好顧 - 家庭照顧同步助手',
  description: '讓照顧者快速整理長輩照顧現況，並一鍵同步給家人了解',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
