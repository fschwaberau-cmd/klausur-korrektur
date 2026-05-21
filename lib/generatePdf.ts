import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import type { Annotation } from "./types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 20,
  },
  legend: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    fontSize: 9,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendSwatch: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
  block: {
    marginBottom: 8,
  },
  annotatedText: {
    padding: 3,
    fontSize: 11,
  },
  erklaerung: {
    fontSize: 9,
    color: "#52525b",
    marginTop: 2,
    fontStyle: "italic",
  },
});

const bewertungToColor: Record<Annotation["bewertung"], string> = {
  gruen: "#bbf7d0",
  gelb: "#fef08a",
  rot: "#fecaca",
};

export async function generateCorrectionPdf(
  annotations: Annotation[]
): Promise<Buffer> {
  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Klausur-Korrektur"),
      React.createElement(
        View,
        { style: styles.legend },
        React.createElement(
          View,
          { style: styles.legendItem },
          React.createElement(View, {
            style: [
              styles.legendSwatch,
              { backgroundColor: bewertungToColor.gruen },
            ],
          }),
          React.createElement(Text, null, "Grün = korrekt")
        ),
        React.createElement(
          View,
          { style: styles.legendItem },
          React.createElement(View, {
            style: [
              styles.legendSwatch,
              { backgroundColor: bewertungToColor.gelb },
            ],
          }),
          React.createElement(Text, null, "Gelb = unvollständig")
        ),
        React.createElement(
          View,
          { style: styles.legendItem },
          React.createElement(View, {
            style: [
              styles.legendSwatch,
              { backgroundColor: bewertungToColor.rot },
            ],
          }),
          React.createElement(Text, null, "Rot = falsch")
        )
      ),
      ...annotations.map((a, i) =>
        React.createElement(
          View,
          { key: i, style: styles.block },
          React.createElement(
            Text,
            {
              style: [
                styles.annotatedText,
                { backgroundColor: bewertungToColor[a.bewertung] },
              ],
            },
            a.text
          ),
          React.createElement(Text, { style: styles.erklaerung }, a.erklaerung)
        )
      )
    )
  );

  return renderToBuffer(doc);
}
