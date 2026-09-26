import { Skeleton } from "@heroui/react";
import type { ReactNode } from "react";
import { Scallop } from "../../artefacts/templates/page/Scallop";

/** Skeletons on the brand band take a darker wash of its ink. */
const onBrand = "bg-brand-foreground/10!";

/**
 * Placeholder shaped like a rendered artefact page (see CategoryPage and
 * BlockSection): brand header with title, summary, tags and date, then one
 * content section, so the real page replaces it without a layout jump.
 */
export function ArtefactSkeleton({ children }: { children?: ReactNode }) {
	return (
		<div aria-busy="true" className="w-full">
			<header className="text-brand-foreground">
				<div className="bg-brand pb-5 pt-10">
					<div className="mx-auto flex w-full max-w-[1000px] flex-col gap-3 px-6 sm:px-10">
						<Skeleton animationType="pulse" className={`h-10 w-3/5 rounded ${onBrand}`} />
						<div className="flex w-full max-w-2xl flex-col gap-2 pt-1">
							<Skeleton animationType="pulse" className={`h-4 w-full rounded ${onBrand}`} />
							<Skeleton animationType="pulse" className={`h-4 w-4/5 rounded ${onBrand}`} />
						</div>
						<div className="flex w-full items-center justify-between gap-2 pt-1">
							<div className="flex gap-2">
								<Skeleton animationType="pulse" className={`h-6 w-16 rounded ${onBrand}`} />
								<Skeleton animationType="pulse" className={`h-6 w-14 rounded ${onBrand}`} />
								<Skeleton animationType="pulse" className={`h-6 w-12 rounded ${onBrand}`} />
							</div>
							<Skeleton animationType="pulse" className={`h-3 w-20 rounded ${onBrand}`} />
						</div>
					</div>
				</div>
				<Scallop edge="bottom" />
			</header>
			<div className="pt-4">
				<section className="mx-auto w-full max-w-[1000px] px-6 py-8 sm:px-10">
					{children && <div className="mb-8">{children}</div>}
					<Skeleton animationType="pulse" className="h-7 w-2/5 rounded" />
					<Skeleton animationType="pulse" className="mt-3 h-4 w-1/3 rounded" />
					<div className="mt-8 flex flex-col">
						{[64, 48, 72, 56, 40].map((width, index) => (
							<div
								key={index}
								className="grid items-center gap-x-4 gap-y-2 border-t border-separator py-3 sm:grid-cols-[minmax(0,20rem)_1fr]"
							>
								<Skeleton animationType="pulse" className="h-4 rounded" style={{ width: `${width}%` }} />
								<Skeleton
									animationType="pulse"
									className="h-3 rounded-sm"
									style={{ marginLeft: `${index * 12}%`, width: `${30 + (index % 3) * 10}%` }}
								/>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
