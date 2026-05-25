"use client";

import React, { useState, useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  align?: "left" | "right" | "center";
  hideOnMobile?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey: (item: T) => string | number;
  pageSize?: number;
}

const TableRow = React.memo(function TableRow({ 
  item, 
  columns, 
  idx 
}: { 
  item: any, 
  columns: Column<any>[], 
  idx: number 
}) {
  return (
    <tr className="hover:bg-surface/30 transition-colors group">
      {columns.map((col, colIdx) => (
        <td
          key={colIdx}
          className={`px-3 md:px-4 py-1.5 ${col.className || ""} ${
            col.hideOnMobile ? "hidden md:table-cell" : ""
          } ${
            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
          }`}
        >
          {typeof col.accessor === "function"
            ? col.accessor(item)
            : (item[col.accessor] as unknown as React.ReactNode)}
        </td>
      ))}
    </tr>
  );
});

export default function Table<T>({
  data,
  columns,
  loading,
  emptyMessage = "No se encontraron datos",
  rowKey,
  pageSize = 8,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);

  if (loading) {
    return (
      <div className="py-24 flex justify-center bg-white/50 rounded-3xl border border-outline-variant/10">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-24 text-center bg-white/50 rounded-3xl border border-outline-variant/10">
        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
           <MoreHorizontal size={24} className="text-outline" />
        </div>
        <p className="font-label text-xs font-bold text-outline uppercase tracking-widest">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-white rounded-[20px] shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-auto min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary border-b border-outline-variant/10">
                {columns.map((col, idx) => (

                  <th
                    key={idx}
                    className={`px-3 md:px-4 py-3 text-[11px] font-bold text-surface uppercase tracking-[0.2em] whitespace-nowrap ${col.className || ""} ${
                      col.hideOnMobile ? "hidden md:table-cell" : ""
                    } ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/5">
              {paginatedData.map((item, idx) => (
                <TableRow 
                  key={rowKey(item)} 
                  item={item} 
                  columns={columns} 
                  idx={idx} 
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-2">
          <p className="font-label text-[10px] font-bold text-outline uppercase tracking-wider">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-outline-variant/20 text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all ${
                    currentPage === i + 1 
                      ? "bg-primary text-on-primary shadow-md" 
                      : "text-outline hover:bg-surface-container"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-outline-variant/20 text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
