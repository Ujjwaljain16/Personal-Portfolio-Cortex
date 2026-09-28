import { notFound } from "next/navigation";
import { renderCard, OG_SIZE } from "@/lib/ogCard";
import { STATUS_LABEL, getProject, projects } from "@/data/projects";

export const alt = "Project by Ujjwal Jain";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
    return projects.map((p) => ({ id: p.id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = getProject(id);
    if (!project) notFound();
    return renderCard({
        eyebrow: "PROJECT",
        title: project.name,
        subtitle: project.tagline,
        chips: [STATUS_LABEL[project.status], project.period.split(" · ")[0]],
    });
}
