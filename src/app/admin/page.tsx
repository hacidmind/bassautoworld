import Link from "next/link";
import { Vehicle, Lead, ActivityLog } from "@/lib/models";
import { requireAdminPage } from "@/auth";
export default async function Admin() {
  await requireAdminPage();
  const [available, sold, leads, inspections, preorders, services, activity] =
    await Promise.all([
      Vehicle.countDocuments({ archived: false, status: "AVAILABLE" }),
      Vehicle.countDocuments({ status: "SOLD" }),
      Lead.countDocuments({ status: "NEW" }),
      Lead.countDocuments({ type: "INSPECTION" }),
      Lead.countDocuments({ type: "PREORDER" }),
      Lead.countDocuments({
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
      }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(12).lean(),
    ]);
  return (
    <>
      <div className="admin-welcome">
        <div>
          <h3>Ready to list your next vehicle?</h3>
          <p>Upload photos, add a description and save to your website.</p>
        </div>
        <div className="actions">
          <Link className="button" href="/admin/vehicles/new">
            Add a vehicle +
          </Link>
          <Link className="button outline" href="/admin/vehicles">
            Manage vehicles
          </Link>
        </div>
      </div>
      <div className="stat-grid">
        {[
          ["Available vehicles", available],
          ["Sold vehicles", sold],
          ["New leads", leads],
          ["Inspection requests", inspections],
          ["Preorders", preorders],
          ["Service requests", services],
        ].map(([label, n]) => (
          <div className="stat" key={label}>
            <strong>{n}</strong>
            {label}
          </div>
        ))}
      </div>
      <h3 style={{ marginTop: 40 }}>Recent activity</h3>
      {activity.length ? (
        <ul>
          {activity.map((a) => (
            <li key={String(a._id)}>
              {String(a.action)} · {String(a.entity)} ·{" "}
              {new Date(a.createdAt).toLocaleDateString("en-GB")}
            </li>
          ))}
        </ul>
      ) : (
        <p>No activity recorded yet.</p>
      )}
    </>
  );
}
