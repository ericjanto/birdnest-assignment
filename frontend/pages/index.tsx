import useSWR, { Fetcher } from 'swr'
import Head from 'next/head'
import Table from '../components/Table'
import { DroneData } from '../types/dronedata.types'
import { DroneVisualisation } from '../components/Visualisation'


const fetcher: Fetcher<DroneData[], string> = (url: RequestInfo | URL) => fetch(url).then(r => r.json())

export default function Home() {
  const { data, error, isLoading } = useSWR(
    'https://birdnest.herokuapp.com/violating-pilots',
    fetcher,
    { refreshInterval: 1000 }
  )

  if (error) return <div>failed to load: server timed out ({error})</div>
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
        <main>
          <div className='flex'>
            <div className='flex-none'>
              <Table droneData={data} />
            </div>
            <div className='flex-1 ml-3'>
              <div className='sticky top-0'>
                <DroneVisualisation droneData={data} width={450} height={450} />
                <div className='text-xs ml-14 mt-2 text-gray-500'>
                  Real-time visualisation of the closest positions to the birdnest
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  return <div>Unexpected, data should be loaded by now.</div>
}
