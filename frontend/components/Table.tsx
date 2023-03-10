import React from 'react'
import { useTable } from 'react-table'

import { DroneData } from '../types/dronedata.types'
import { prettifyData } from '../utils/utils'
import { highlightCircle, resetCircle } from './Visualisation'

type TableProps = {
    droneData: DroneData[]
}

export default function Table({ droneData }: TableProps) {
    const data = React.useMemo(
        () => prettifyData(droneData),
        [droneData]
    )

    const columns = React.useMemo(
        () => [
            {
                Header: 'Last Seen (UTC)',
                accessor: 'last_seen_formatted',
            },
            {
                Header: 'Min. Distance (m)',
                accessor: 'min_dist_to_nest',
            },
            {
                Header: 'First Name',
                accessor: 'first_name',
            },
            {
                Header: 'Last Name',
                accessor: 'last_name',
            },
            {
                Header: 'Phone Number',
                accessor: 'phone_number',
            },
            {
                Header: 'Email Address',
                accessor: 'email',
            },
        ],
        []
    )


    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        // @ts-expect-error
    } = useTable({ columns, data })

    return (
        <table {...getTableProps()} className='table-auto prose-sm'>
            <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th
                                {...column.getHeaderProps()}
                                className='whitespace-nowrap border sticky top-0 bg-white'
                            >
                                {column.render('Header')}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                    prepareRow(row)
                    return (
                        <tr {...row.getRowProps()}
                            className='hover:bg-gray-100'
                            onMouseEnter={() => {
                                highlightCircle(row.original.serialnumber)
                            }}

                            onMouseLeave={() => {
                                resetCircle(row.original.serialnumber)
                            }}
                        >
                            {row.cells.map(cell => {
                                return (
                                    <td
                                        {...cell.getCellProps()}
                                        className='border'
                                    >
                                        {cell.render('Cell')}
                                    </td>
                                )
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}