import { redirect } from "next/navigation";

export default async function TopicPage({ params }: { params: Promise<{ tech: string; topic: string }> }) {
  const { tech, topic } = await params;
  redirect(`/tech/${tech}/${topic}/details`);
}
