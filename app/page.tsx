import Habitat from "@/components/habitat";

export default async function Home({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
  const params = await searchParams;
  return <Habitat visitorMode={params.mode === "visitor"} />;
}
