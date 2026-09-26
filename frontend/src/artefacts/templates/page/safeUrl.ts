/** Only supplied HTTPS links are rendered; anything else stays plain text. */
export function safeUrl(url?: string | null) {
	return url?.startsWith("https://") ? url : undefined;
}
