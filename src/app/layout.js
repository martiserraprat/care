// src/app/layout.js
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import '@/styles/globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex flex-col h-screen"> {/* Flexbox para la estructura global */}
        <Navbar />
        <div className="flex flex-1 overflow-hidden"> {/* Sidebar y contenido */}
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50"> {/* Contenido dinámico */}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}