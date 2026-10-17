import { ListDetailScreen } from "@/features/lists/ListDetailScreen";

export default async function ListPage({ params }: PageProps<"/lists/[id]">) {
  const { id } = await params;
  return <ListDetailScreen id={decodeURIComponent(id)} />;
}
