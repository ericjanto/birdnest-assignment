import { DroneData } from "../types/dronedata.types"

// DATA REPRESENTATION
export function prettifyData(data: DroneData[]) {
    for (let i = 0; i < data.length; i++) {
      data[i].last_seen_formatted = getUTCTime(new Date(data[i].last_seen))
      data[i].last_violated_formatted = getUTCTime(new Date(data[i].last_violated))
      data[i].min_dist_to_nest = parseFloat(data[i].min_dist_to_nest).toFixed(2)
    }
    return data
  }

// DATES
export function getUTCTime(date: Date): string {
    const utcString = date.toUTCString()
    const endIndex = utcString.indexOf('GMT')
    const startIndex = endIndex - ' HH:MM:SS '.length
    return utcString.substring(startIndex, endIndex)
}