import useSWR, { Fetcher } from 'swr'
import Head from 'next/head'

import Table from '../components/Table'
import { DroneData } from '../types/dronedata.types'


const fetcher: Fetcher<DroneData[], string> = (url: RequestInfo | URL) => fetch(url).then(r => r.json())

export default function Home() {

  const { data, error, isLoading } = useSWR(
    'https://birdnest.herokuapp.com/violating-pilots',
    fetcher,
    { refreshInterval: 1000 }
  )

  if (error) return <div>failed to load: {JSON.stringify(error)}</div>
  if (isLoading) return <div>loading...</div>

  if (data) {
    return (
      <>
        <Head>
          <title>Birdnest Assignment</title>
          <meta name="description" content="Birdnest Assignment" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className='prose'>
          <Table droneData={data}></Table>
        </main>
      </>
    )
  }

  return <div>Unexpected</div>
}
