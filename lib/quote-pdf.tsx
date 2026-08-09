/**
 * Quotation / invoice PDF rendering.
 *
 * Uses @react-pdf/renderer to build a branded, print-ready PDF that matches
 * the lodge's identity (terracotta / walnut / cream / gold / ink). The same
 * data shape powers the public /quote/[token] page, so the HTML view and the
 * PDF always agree.
 */

import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { formatZAR } from "./quotes";
import type { QuoteWithLines } from "./quotes";

// Brand-safe pairing without network font fetches: Helvetica family with the
// brand colors. (Google-font registration would need font files on disk.)
const ink = "#2a1e18";
const terracotta = "#8f3e25";
const walnut = "#4a2e22";
const stone = "#6b5b50";
const gold = "#d4a574";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: ink,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: terracotta,
    marginBottom: 18,
  },
  lodgeName: {
    fontSize: 19,
    fontWeight: "bold",
    color: walnut,
    letterSpacing: 0.5,
  },
  lodgeMotto: {
    fontSize: 9,
    color: terracotta,
    fontStyle: "italic",
    marginTop: 2,
  },
  docMeta: {
    alignItems: "flex-end",
    fontSize: 9,
    color: stone,
  },
  docNumber: {
    fontSize: 13,
    fontWeight: "bold",
    color: ink,
    marginBottom: 3,
  },
  statusPill: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: walnut,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
  },
  billTo: {
    width: "60%",
  },
  billToLabel: {
    fontSize: 8,
    color: stone,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  billToName: {
    fontSize: 12,
    fontWeight: "bold",
    color: ink,
  },
  billToDetail: {
    fontSize: 9,
    color: stone,
    marginTop: 1,
  },
  metaRight: {
    width: "40%",
    alignItems: "flex-end",
    fontSize: 9,
    color: stone,
  },
  metaRightBold: {
    fontWeight: "bold",
    color: ink,
  },
  table: {
    marginTop: 22,
    marginBottom: 16,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: walnut,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  th: {
    color: "#faf6f0",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  colDesc: { width: "44%" },
  colQty: { width: "12%" },
  colUnit: { width: "14%" },
  colPrice: { width: "15%" },
  colAmount: { width: "15%", textAlign: "right" },
  tr: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e8ddd6",
  },
  td: {
    fontSize: 9,
    color: ink,
  },
  tdDesc: { width: "44%", fontWeight: "bold", color: walnut },
  tdQty: { width: "12%" },
  tdUnit: { width: "14%" },
  tdPrice: { width: "15%" },
  tdAmount: { width: "15%", textAlign: "right", fontWeight: "bold" },
  totals: {
    alignSelf: "flex-end",
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 9,
    color: stone,
  },
  totalRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: terracotta,
    fontWeight: "bold",
    fontSize: 12,
    color: ink,
  },
  notes: {
    marginTop: 22,
    padding: 10,
    backgroundColor: "#f5ebdd",
    borderRadius: 4,
    fontSize: 8.5,
    color: walnut,
  },
  notesLabel: {
    fontWeight: "bold",
    fontSize: 8,
    color: terracotta,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#e8ddd6",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: stone,
  },
});

export function QuotePdf({ data }: { data: QuoteWithLines }) {
  const { quote, lines, request } = data;
  const vatRate = parseFloat(quote.vatRate) || 0;
  const statusLabel =
    quote.status === "sent" ? "Sent" : quote.status === "accepted" ? "Accepted" : "Draft";

  return (
    <Document
      title={`${quote.quoteNumber} — Gomodi Guest Lodge`}
      author="Gomodi Guest Lodge"
      subject={`Quotation ${quote.quoteNumber}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.lodgeName}>Gomodi Guest Lodge</Text>
            <Text style={styles.lodgeMotto}>Iphe Lerato</Text>
            <Text style={[styles.lodgeMotto, { fontStyle: "normal", color: stone }]}>
              Mafikeng, North West, South Africa
            </Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docNumber}>{quote.quoteNumber}</Text>
            <Text>Issued: {new Date(quote.createdAt).toLocaleDateString("en-ZA")}</Text>
            {quote.validUntil && (
              <Text>Valid until: {new Date(quote.validUntil).toLocaleDateString("en-ZA")}</Text>
            )}
            <Text style={styles.statusPill}>{statusLabel.toUpperCase()}</Text>
          </View>
        </View>

        {/* Bill to + meta */}
        <View style={styles.row}>
          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>Prepared for</Text>
            <Text style={styles.billToName}>{request.guestName}</Text>
            {request.contactPhone && (
              <Text style={styles.billToDetail}>{request.contactPhone}</Text>
            )}
            {request.contactEmail && (
              <Text style={styles.billToDetail}>{request.contactEmail}</Text>
            )}
          </View>
          <View style={styles.metaRight}>
            <Text>
              Request type: <Text style={styles.metaRightBold}>{request.category}</Text>
            </Text>
            <Text>
              Request #<Text style={styles.metaRightBold}>{request.id}</Text>
            </Text>
          </View>
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colUnit]}>Unit</Text>
            <Text style={[styles.th, styles.colPrice]}>Rate</Text>
            <Text style={[styles.th, styles.colAmount]}>Amount</Text>
          </View>
          {lines.length === 0 && (
            <View style={styles.tr}>
              <Text style={[styles.td, styles.tdDesc]}>Awaiting pricing</Text>
              <Text style={[styles.td, styles.tdQty]}>—</Text>
              <Text style={[styles.td, styles.tdUnit]}>—</Text>
              <Text style={[styles.td, styles.tdPrice]}>—</Text>
              <Text style={[styles.td, styles.tdAmount]}>—</Text>
            </View>
          )}
          {lines.map((l, i) => {
            const amount = (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0);
            return (
              <View style={styles.tr} key={l.id ?? i}>
                <Text style={[styles.td, styles.tdDesc]}>{l.description}</Text>
                <Text style={[styles.td, styles.tdQty]}>{l.quantity}</Text>
                <Text style={[styles.td, styles.tdUnit]}>{l.unit}</Text>
                <Text style={[styles.td, styles.tdPrice]}>{formatZAR(l.unitPrice)}</Text>
                <Text style={[styles.td, styles.tdAmount]}>{formatZAR(amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal (excl. VAT)</Text>
            <Text>{formatZAR(quote.subtotal)}</Text>
          </View>
          {vatRate > 0 && (
            <View style={styles.totalRow}>
              <Text>VAT ({vatRate}%)</Text>
              <Text>{formatZAR(quote.vatAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRowGrand}>
            <Text>Total</Text>
            <Text>{formatZAR(quote.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Gomodi Guest Lodge · Iphe Lerato</Text>
          <Text>{quote.quoteNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Render the quote to a PDF Buffer for streaming to the requester. */
export async function renderQuotePdf(data: QuoteWithLines): Promise<Buffer> {
  const blob = await pdf(<QuotePdf data={data} />).toBlob();
  return Buffer.from(await blob.arrayBuffer());
}
