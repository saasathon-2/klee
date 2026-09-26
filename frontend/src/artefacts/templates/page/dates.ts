/**
 * Parses an ISO 8601 date or date-time. Date-only values are read in local
 * time so "2026-09-26" never renders as the 25th west of UTC.
 */
export function parseDate(value?: string | null) {
	if (!value) return undefined;
	const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	const date = day
		? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
		: new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

const hasTime = (value: string) => /T\d{2}:\d{2}/.test(value);

/** "26 Sept"; falls back to the raw string when it isn't a date. */
export function formatDate(value: string) {
	return (
		parseDate(value)?.toLocaleDateString(undefined, {
			day: "numeric",
			month: "short",
		}) ?? value
	);
}

/** "26 Sept, 14:05" for date-times, "26 Sept" for dates. */
export function formatDateTime(value: string) {
	const date = parseDate(value);
	if (!date) return value;
	return hasTime(value)
		? date.toLocaleString(undefined, {
				day: "numeric",
				month: "short",
				hour: "2-digit",
				minute: "2-digit",
			})
		: formatDate(value);
}

/** "14:05" for date-times, "26 Sept" for dates. */
export function formatTime(value: string) {
	const date = parseDate(value);
	if (!date) return value;
	return hasTime(value)
		? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
		: formatDate(value);
}

/** "3h 20m" between two date-times. */
export function formatDuration(from: string, to: string) {
	const start = parseDate(from);
	const end = parseDate(to);
	if (!start || !end) return undefined;
	const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
	const days = Math.floor(minutes / 1440);
	const hours = Math.floor((minutes % 1440) / 60);
	const rest = minutes % 60;
	return [days && `${days}d`, hours && `${hours}h`, (rest || minutes === 0) && `${rest}m`]
		.filter(Boolean)
		.join(" ");
}
