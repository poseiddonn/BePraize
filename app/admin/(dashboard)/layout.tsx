import type { Metadata } from "next";
import { AdminHeaderClient } from "@/app/admin/(dashboard)/AdminHeaderClient";

export const metadata: Metadata = {
  title: "Admin — BePraize Sax",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#09090f",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <AdminHeaderClient />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
