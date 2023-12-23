export function toUtcDate(utcDateString: string): Date {
    // string should have the formate provided by sqlite, which is yyyy-mm-dd hh:mm:ss
    if(utcDateString.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
        return new Date(`${utcDateString.replace(' ', 'T')}Z`);
    }
    return new Date(utcDateString);
}