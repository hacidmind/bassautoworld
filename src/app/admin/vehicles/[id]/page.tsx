import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { requireAdminPage } from "@/auth";
import { Vehicle } from "@/lib/models";
import { VehicleEditor } from "@/components/admin";
export default async function Editor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  if (id === "new") return <VehicleEditor />;
  if (!isValidObjectId(id)) notFound();
  const v = await Vehicle.findById(id).lean();
  if (!v) notFound();
  return <VehicleEditor initial={JSON.parse(JSON.stringify(v))} />;
}
