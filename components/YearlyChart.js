import { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function YearlyChart({ data }) {
  const [selectedMonth, setSelectedMonth] = useState(null);

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Yearly Progress</Text>
        <Text style={styles.emptyText}>No data available yet</Text>
      </View>
    );
  }

  const maxHours = Math.max(...data.map((d) => d.hours), 1);
  const chartWidth = width - 100;
  const chartHeight = 200;
  const barWidth = chartWidth / data.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yearly Progress</Text>

      {/* Bar Chart Style Display */}
      <View style={styles.chartWrapper}>
        <View style={styles.yAxisLabels}>
          <Text style={styles.yLabel}>{Math.round(maxHours)}h</Text>
          <Text style={styles.yLabel}>{Math.round(maxHours / 2)}h</Text>
          <Text style={styles.yLabel}>0h</Text>
        </View>

        <View style={styles.chartContainer}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
          <View style={[styles.gridLine, { top: chartHeight }]} />

          {/* Bars */}
          <View style={styles.barsContainer}>
            {data.map((item, index) => {
              const heightPercent =
                maxHours > 0 ? (item.hours / maxHours) * 100 : 0;
              const isSelected = selectedMonth === index;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.barColumn, { width: barWidth }]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <View style={styles.barWrapper}>
                    {item.hours > 0 && (
                      <Text style={styles.barValue}>{item.hours}h</Text>
                    )}
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(heightPercent, 2) + "%",
                          backgroundColor: isSelected ? "#dc2626" : "#3b82f6",
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.monthLabel,
                      isSelected && styles.monthLabelActive,
                    ]}
                  >
                    {item.monthYear || item.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Selected Month Details */}
      {selectedMonth !== null && (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsMonth}>
            {data[selectedMonth].monthYear || data[selectedMonth].month}
          </Text>
          <Text style={styles.detailsDateRange}>
            {data[selectedMonth].dateRange || ""}
          </Text>
          <Text style={styles.detailsHours}>{data[selectedMonth].hours}h</Text>
        </View>
      )}

      <Text style={styles.helpText}>Tap on a bar to see monthly details</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    paddingVertical: 20,
  },
  chartWrapper: {
    flexDirection: "row",
    marginBottom: 20,
  },
  yAxisLabels: {
    width: 35,
    justifyContent: "space-between",
    paddingRight: 8,
  },
  yLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  chartContainer: {
    flex: 1,
    height: 200,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    position: "relative",
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 2,
  },
  barWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  barValue: {
    fontSize: 9,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  bar: {
    width: "85%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  monthLabel: {
    fontSize: 8,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 6,
  },
  monthLabelActive: {
    color: "#dc2626",
    fontWeight: "bold",
  },
  detailsBox: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  detailsMonth: {
    fontSize: 14,
    color: "#1e40af",
    fontWeight: "600",
  },
  detailsDateRange: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  detailsHours: {
    fontSize: 20,
    color: "#2563eb",
    fontWeight: "bold",
    marginTop: 8,
  },
  helpText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },
});
