export interface ILocation {
    country?: string;
    region?: string;
    city?: string;
}

export function formatLocation(location: ILocation): string {
    let loc = '';

    if (location.country) {
        loc += location.country;
    }
    if (location.region) {
        if (loc) loc += ', ';
        loc += location.region;
    }
    if (location.city) {
        if (loc) loc += ', ';
        loc += location.city;
    }
    return loc;
}
