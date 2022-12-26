import React from 'react'
import { useTable } from 'react-table'

import { DroneData } from '../types/dronedata.types'
import { prettifyData } from '../utils/utils'

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
                Header: 'Last Violation (UTC)',
                accessor: 'last_violated_formatted',
            },
            {
                Header: 'Min. Distance to Nest (m)',
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
        <table {...getTableProps()} style={{ border: 'solid 1px blue' }}>
            <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th
                                {...column.getHeaderProps()}
                                style={{
                                    borderBottom: 'solid 3px red',
                                    background: 'aliceblue',
                                    color: 'black',
                                    fontWeight: 'bold',
                                }}
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
                        <tr {...row.getRowProps()}>
                            {row.cells.map(cell => {
                                return (
                                    <td
                                        {...cell.getCellProps()}
                                        style={{
                                            padding: '10px',
                                            border: 'solid 1px gray',
                                            background: 'papayawhip',
                                        }}
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