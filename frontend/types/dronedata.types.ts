export interface DroneData {
    serialnumber: string,
    last_seen: string,
    last_violated: string,
    // Formatting happens in frontend only
    last_seen_formatted: string | null,
    last_violated_formatted: string | null,
    min_position_x: string,
    min_position_y: string,
    min_dist_to_nest: string,
    first_name: string,
    last_name: string,
    phone_number: string,
    email: string,
}
