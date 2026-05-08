import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { t } from "i18next";

export default function UsersTable({ columns, data,loading }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-3xl border border-white/10 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.03]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-6 py-4 text-start text-white/40 text-xs font-bold uppercase tracking-wider">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
  {loading ? (
    [...Array(5)].map((_, i) => (
      <tr key={i} className="border-t border-white/10">
        {columns.map((col, j) => (
          <td key={j} className="px-4 py-3">
            <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
          </td>
        ))}
      </tr>
    ))
  ) : data.length === 0 ? (
    <tr>
      <td
        colSpan={columns.length}
        className="px-4 py-6 text-center text-white/40"
      >
        {t("common.nodata")}
      </td>
    </tr>
  ) : (
    table.getRowModel().rows.map((row) => (
      <tr
        key={row.id}
        className="border-t border-white/10 hover:bg-white/[0.03]"
      >
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} className="px-6 py-4 text-start text-white/80 whitespace-nowrap">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    ))
  )}
</tbody>

      </table>
    </div>
  );
}
