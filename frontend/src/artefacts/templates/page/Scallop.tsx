/** Wavy lavender edge that attaches to the top or bottom of a lavender band. */
export function Scallop({ edge }: { edge: "top" | "bottom" }) {
	return <div aria-hidden className="artefact-scallop" data-edge={edge} />;
}
