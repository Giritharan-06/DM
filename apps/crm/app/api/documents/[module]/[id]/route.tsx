import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Page,
  Text,
  View,
  renderToBuffer,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  db,
  invoices,
  invoiceItems,
  quotations,
  quotationItems,
  systemSettings,
} from "@zyroz/database";
import { eq } from "drizzle-orm";
import { authorize, assertClient, assertLead, ApiError } from "@/lib/server";
import { money } from "@zyroz/validation";
import { z } from "zod";
export const runtime = "nodejs";
const styles = StyleSheet.create({
  page: {
    padding: 45,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  title: { fontSize: 27, color: "#6c4dff", marginBottom: 25 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottom: "1px solid #eee",
  },
  muted: { color: "#64748b", fontSize: 9 },
  total: { fontSize: 17, textAlign: "right", marginTop: 25 },
});
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ module: string; id: string }> },
) {
  try {
    const { module, id } = await params;
    z.uuid().parse(id);
    if (module !== "invoices" && module !== "quotations")
      throw new ApiError(404, "Document not found.");
    const actor = await authorize(req.headers, module);
    let heading: string,
      total: number,
      discount: number,
      taxBps: number,
      clientId: string | null,
      items: { description: string; quantity: number; rate: number }[];
    let leadId: string | null = null;
    let date: Date;
    let dueDate: Date;
    let status: string;
    let gstin: string | null = null;
    let paid = 0;
    if (module === "invoices") {
      const [row] = await db()
        .select()
        .from(invoices)
        .where(eq(invoices.id, id));
      if (!row) throw new ApiError(404, "Invoice not found.");
      heading = row.number;
      total = row.total;
      discount = row.discount;
      taxBps = row.taxBps;
      clientId = row.clientId;
      date = row.date;
      dueDate = row.dueDate;
      status = row.status;
      gstin = row.gstin;
      paid = row.paid;
      items = await db()
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));
    } else {
      const [row] = await db()
        .select()
        .from(quotations)
        .where(eq(quotations.id, id));
      if (!row) throw new ApiError(404, "Quotation not found.");
      heading = "Quotation " + row.id.slice(0, 8);
      total = row.total;
      discount = row.discount;
      taxBps = row.taxBps;
      clientId = row.clientId;
      leadId = row.leadId;
      date = row.createdAt;
      dueDate = row.validUntil;
      status = row.status;
      gstin = row.gstin;
      items = await db()
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, id));
    }
    const client = clientId
      ? await assertClient(actor, clientId)
      : leadId
        ? await assertLead(actor, leadId)
        : null;
    if (!client) throw new ApiError(404, "Billing contact not found.");
    const [agencyRow] = await db()
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "agency"));
    const agency = agencyRow?.value || {};
    const profile = (key: string) =>
      typeof agency[key] === "string" ? String(agency[key]) : "";
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0,
    );
    const tax = total - (subtotal - discount);
    const buffer = await renderToBuffer(
      <Document>
        <Page size="A4" style={styles.page}>
          <Text
            style={[
              styles.title,
              {
                color: /^#[0-9a-f]{6}$/i.test(profile("brandColor"))
                  ? profile("brandColor")
                  : "#6c4dff",
              },
            ]}
          >
            {profile("name") || "ZYROZ"}
          </Text>
          {profile("address") && (
            <Text style={styles.muted}>{profile("address")}</Text>
          )}
          <Text style={styles.muted}>
            {[profile("email"), profile("phone")].filter(Boolean).join(" | ")}
          </Text>
          {profile("gstin") && (
            <Text style={styles.muted}>Agency GSTIN: {profile("gstin")}</Text>
          )}
          <Text style={{ fontSize: 18, marginBottom: 20 }}>{heading}</Text>
          <Text>{client.businessName}</Text>
          <Text style={styles.muted}>
            {"contactPerson" in client ? client.contactPerson : client.name} |{" "}
            {client.email} | {client.phone}
          </Text>
          {"address" in client && client.address && (
            <Text style={styles.muted}>{client.address}</Text>
          )}
          <View style={{ marginTop: 20 }}>
            <Text>Date: {date.toISOString().slice(0, 10)}</Text>
            <Text>
              {module === "invoices" ? "Due date" : "Valid until"}:{" "}
              {dueDate.toISOString().slice(0, 10)}
            </Text>
            <Text>Status: {status.replaceAll("_", " ")}</Text>
            {gstin && <Text>Customer GSTIN: {gstin}</Text>}
          </View>
          <View style={{ marginTop: 35 }}>
            {items.map((item, i) => (
              <View style={styles.row} key={i}>
                <Text style={{ width: "60%" }}>{item.description}</Text>
                <Text>
                  {item.quantity} x {money(item.rate).replace("₹", "INR ")}
                </Text>
                <Text>
                  {money(item.quantity * item.rate).replace("₹", "INR ")}
                </Text>
              </View>
            ))}
          </View>
          <Text style={{ textAlign: "right", marginTop: 20 }}>
            Subtotal: {money(subtotal).replace("₹", "INR ")}
          </Text>
          <Text style={{ textAlign: "right", marginTop: 10 }}>
            Discount: {money(discount).replace("₹", "INR ")}
          </Text>
          <Text style={{ textAlign: "right", marginTop: 10 }}>
            Tax ({(taxBps / 100).toFixed(2)}%):{" "}
            {money(tax).replace("₹", "INR ")}
          </Text>
          {module === "invoices" && (
            <View>
              <Text style={{ textAlign: "right", marginTop: 10 }}>
                Paid: {money(paid).replace("₹", "INR ")}
              </Text>
              <Text style={{ textAlign: "right", marginTop: 10 }}>
                Balance: {money(total - paid).replace("₹", "INR ")}
              </Text>
            </View>
          )}
          <Text style={styles.total}>
            Total: {money(total).replace("₹", "INR ")}
          </Text>
          <Text style={{ ...styles.muted, marginTop: 45 }}>
            Generated from your agency record. Confirm legal invoice details and
            applicable tax treatment before issuing.
          </Text>
        </Page>
      </Document>,
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="zyroz-${module}-${id.slice(0, 8)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ApiError ? error.message : "Document unavailable.",
      },
      { status: error instanceof ApiError ? error.status : 503 },
    );
  }
}
