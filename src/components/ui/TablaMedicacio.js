
// src/components/ui/TablaMedicacio.js
export default function TablaMedicacio() {
  // En el futuro, estos datos vendrán de tu base de datos (Backend)
  const medicaciones = [
    { hora: '08:00', nombre: 'Omeprazol', cantidad: '1 comprimit', estado: 'Pres', color: 'bg-green-100 text-green-700' },
    { hora: '09:00', nombre: 'Paracetamol', cantidad: '500mg', estado: 'Pres', color: 'bg-green-100 text-green-700' },
    { hora: '14:00', nombre: 'Ibuprofèn', cantidad: '400mg', estado: 'Pendent', color: 'bg-red-100 text-red-700' },
    { hora: '21:00', nombre: 'Simvastatina', cantidad: '20mg', estado: 'Pendent', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-lg text-slate-800">Pla de Medicació d'Avui</h2>
        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Dilluns, 24 de Maig</span>
      </div>
      
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
          <tr>
            <th className="py-3 px-4 rounded-l-lg">Hora</th>
            <th className="py-3 px-4">Medicament</th>
            <th className="py-3 px-4">Quantitat</th>
            <th className="py-3 px-4 rounded-r-lg">Estat</th>
          </tr>
        </thead>
        <tbody>
          {/* Aquí hacemos el equivalente a un foreach en PHP */}
          {medicaciones.map((med, index) => (
            <tr key={index} className="border-b last:border-0 border-slate-100">
              <td className="py-4 px-4 font-bold text-blue-600">{med.hora}</td>
              <td className="py-4 px-4 font-semibold text-slate-800">{med.nombre}</td>
              <td className="py-4 px-4 text-slate-600">{med.cantidad}</td>
              <td className="py-4 px-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${med.color}`}>
                  {med.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}