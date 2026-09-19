import { notFound } from "next/navigation";
import { requireAdminPage } from "@/auth";
import {
  Vehicle,
  Lead,
  Review,
  SiteSetting,
  InspectionRequest,
} from "@/lib/models";
import { AdminList, SettingsForm } from "@/components/admin";
export default async function AdminSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  await requireAdminPage();
  const { section } = await params;
  if (
    ![
      "vehicles",
      "leads",
      "inspections",
      "preorders",
      "service-requests",
      "reviews",
      "settings",
    ].includes(section)
  )
    notFound();
  if (section === "settings") {
    const s = await SiteSetting.findOne({ key: "business" }).lean();
    return (
      <SettingsForm initial={JSON.parse(JSON.stringify(s?.value || {}))} />
    );
  }
  const query =
    section === "inspections"
      ? { type: "INSPECTION" }
      : section === "preorders"
        ? { type: "PREORDER" }
        : section === "service-requests"
          ? {
              type: {
                $in: [
                  "SHIPPING",
                  "CLEARING",
                  "FORWARDING",
                  "IMPORTATION",
                  "TRUCKING",
                  "AUCTION_SOURCING",
                ],
              },
            }
          : {};
  const model =
    section === "vehicles" ? Vehicle : section === "reviews" ? Review : Lead;
  const items = await model
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  if (section === "inspections") {
    const inspections = await InspectionRequest.find({
      lead: { $in: items.map((item) => item._id) },
    }).lean();
    for (const item of items)
      item.inspectionStatus =
        inspections.find((request) => String(request.lead) === String(item._id))
          ?.status || "NEW";
  }
  return (
    <AdminList section={section} initial={JSON.parse(JSON.stringify(items))} />
  );
}
