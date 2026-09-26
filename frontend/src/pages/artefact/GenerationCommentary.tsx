export function GenerationCommentary({ text }: { text: string }) {
	const cleanText = text.replace(/\*\*/g, "").trim();
	const words = cleanText.split(/\s+/).filter(Boolean);
	const period = cleanText.indexOf(".");
	const displayText =
		words.length > 20
			? period >= 0
				? cleanText.slice(0, period + 1)
				: words.slice(0, 20).join(" ")
			: cleanText;
	return (
		<span className="generation-commentary whitespace-nowrap">
			{displayText
				.split(/\s+/)
				.filter(Boolean)
				.map((word, index) => (
					<span
						key={index}
						className="generation-commentary-word"
						style={{ animationDelay: `${index * 20}ms` }}
					>
						{index > 0 && " "}
						{word}
					</span>
				))}
		</span>
	);
}
