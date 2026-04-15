import type { Metadata } from "next";
import { getPlaylistById, getPlaylistVideos } from "@/lib/youtube";
import SeriesDetail from "@/components/series/SeriesDetail";
import { notFound } from "next/navigation";

export const revalidate = 1800; // 30 minutes

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playlistId: string }>;
}): Promise<Metadata> {
  const { playlistId } = await params;
  const playlist = await getPlaylistById(playlistId);
  if (!playlist) return { title: "Series | AmanAI Lab" };

  return {
    title: `${playlist.title} | AmanAI Lab`,
    description: playlist.description || `Watch the ${playlist.title} series on AmanAI Lab.`,
  };
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ playlistId: string }>;
}) {
  const { playlistId } = await params;

  const [playlist, videos] = await Promise.all([
    getPlaylistById(playlistId),
    getPlaylistVideos(playlistId, 30),
  ]);

  if (!playlist) notFound();

  return (
    <div className="pt-16">
      <SeriesDetail playlist={playlist} videos={videos} />
    </div>
  );
}
