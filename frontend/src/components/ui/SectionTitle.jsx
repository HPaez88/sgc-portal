import React from 'react';

export function SectionTitle({ icon, title, required }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b-2 border-cyan-500 mb-4">
      {icon && <span className="text-lg">{icon}</span>}
      <h3 className="text-base font-bold text-[#002855] m-0">{title}</h3>
      {required && <span className="text-red-500">*</span>}
    </div>
  );
}

export default SectionTitle;
