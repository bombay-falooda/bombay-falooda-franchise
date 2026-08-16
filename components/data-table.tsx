import { ReactNode } from "react";

type DataTableProps = {
  columns: string[];
  children: ReactNode;
};

export function DataTable({ columns, children }: DataTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-[20px] border border-[#d8e8e5] bg-white/78 shadow-[0_14px_34px_rgba(20,83,78,0.06)] backdrop-blur-xl">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="bg-[#e9fbf7]/90 text-xs font-extrabold uppercase tracking-wide text-[#0f766e]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="border-b border-[#d8e8e5] px-4 py-3 whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e8f1ef]">{children}</tbody>
      </table>
    </div>
  );
}
