export function KleeLogo({
	className,
	alt = "Klee",
}: {
	className?: string;
	alt?: string;
}) {
	return <img src="/klee1.svg" alt={alt} className={className} />;
}
