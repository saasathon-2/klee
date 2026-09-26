export function KleeLogo({
	className,
	alt = "Klee",
}: {
	className?: string;
	alt?: string;
}) {
	return <img src="/kleelogo.svg" alt={alt} className={className} />;
}
