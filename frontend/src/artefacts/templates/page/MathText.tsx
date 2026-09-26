import katex from "katex";
import "katex/contrib/mhchem";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

/**
 * Typesets LaTeX (and mhchem `\ce{}` chemistry) with KaTeX. Commands that
 * could load URLs or run HTML stay disabled (`trust: false`), and bad input
 * renders as KaTeX's inline error text instead of throwing.
 */
export function MathText({
	latex,
	display = false,
	className,
}: {
	latex: string;
	display?: boolean;
	className?: string;
}) {
	const html = useMemo(
		() =>
			katex.renderToString(latex, {
				displayMode: display,
				throwOnError: false,
				trust: false,
				strict: "ignore",
				output: "htmlAndMathml",
			}),
		[latex, display],
	);
	return (
		<span
			className={className}
			// KaTeX output is generated markup, not model HTML.
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
