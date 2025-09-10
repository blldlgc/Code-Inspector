import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<T> {
  columns: {
    id?: string
    accessorKey?: string
    header: string | React.ReactNode
    cell?: (props: { row: { getValue: (key: string) => any; original: T } }) => React.ReactNode
  }[]
  data: T[]
}

export function DataTable<T>({ columns, data }: DataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id || column.accessorKey}>
                {typeof column.header === 'string' ? column.header : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell key={column.id || column.accessorKey}>
                  {column.cell 
                    ? column.cell({ 
                        row: { 
                          getValue: (key: string) => (row as any)[key],
                          original: row 
                        } 
                      })
                    : column.accessorKey 
                      ? (row as any)[column.accessorKey] 
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}