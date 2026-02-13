import { StyleSheet } from "@react-pdf/renderer";

export const pageStyles = StyleSheet.create({
  page: {
    flexDirection: "column" as const,
    padding: 40,
    paddingBottom: 60,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
});
