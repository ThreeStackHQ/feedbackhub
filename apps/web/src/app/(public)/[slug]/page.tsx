export default function PublicBoardPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Public Board: {params.slug}</h1>
      <p className="text-muted-foreground mt-2">Vote on feature requests</p>
    </div>
  );
}
