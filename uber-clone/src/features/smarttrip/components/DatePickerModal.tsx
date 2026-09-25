import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";

interface DatePickerModalProps {
  visible: boolean;
  selectedDateStr: string; // e.g., "15-Oct-2026" or "2026-10-15"
  onClose: () => void;
  onSelectDate: (formattedDate: string) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export function DatePickerModal({
  visible,
  selectedDateStr,
  onClose,
  onSelectDate,
}: DatePickerModalProps) {
  // Parse initial date
  const parseInitialDate = () => {
    try {
      if (selectedDateStr) {
        const parts = selectedDateStr.split("-");
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            // DD-Mon-YYYY
            const day = parseInt(parts[0]);
            const mIdx = MONTH_SHORT.findIndex(
              (m) => m.toLowerCase() === parts[1].toLowerCase()
            );
            const year = parseInt(parts[2]);
            if (mIdx >= 0 && year > 2000) {
              return new Date(year, mIdx, day);
            }
          }
        }
      }
    } catch {}
    return new Date();
  };

  const initial = parseInitialDate();
  const [viewYear, setViewYear] = useState<number>(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initial.getMonth()); // 0-indexed
  const [chosenDate, setChosenDate] = useState<Date>(initial);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Days calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handleDayPress = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    setChosenDate(newDate);
  };

  const handleConfirm = () => {
    const dayStr = String(chosenDate.getDate()).padStart(2, "0");
    const mStr = MONTH_SHORT[chosenDate.getMonth()];
    const yStr = chosenDate.getFullYear();
    const formatted = `${dayStr}-${mStr}-${yStr}`;
    onSelectDate(formatted);
    onClose();
  };

  // Header display string
  const dayName = DAY_NAMES[chosenDate.getDay()];
  const dayNum = chosenDate.getDate();
  const monthNameShort = MONTH_SHORT[chosenDate.getMonth()];
  const headerDateStr = `${dayName}, ${dayNum} ${monthNameShort}`;

  // Grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.cardContainer}>
          {/* Header matching IRCTC/Google calendar design */}
          <View style={styles.headerBanner}>
            <Text style={styles.headerYear}>{chosenDate.getFullYear()}</Text>
            <Text style={styles.headerDate}>{headerDateStr}</Text>
          </View>

          {/* Month & Year Navigation */}
          <View style={styles.navRow}>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear} ▾
            </Text>
            <View style={styles.arrowsGroup}>
              <TouchableOpacity
                onPress={prevMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.arrowButton}
              >
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.arrowButton}
              >
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.dayHeadersRow}>
            {DAY_LETTERS.map((letter, idx) => (
              <View key={idx} style={styles.cell}>
                <Text style={styles.dayHeaderLetter}>{letter}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Day Grid */}
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={idx} style={styles.cell} />;
              }
              const isSelected =
                chosenDate.getFullYear() === viewYear &&
                chosenDate.getMonth() === viewMonth &&
                chosenDate.getDate() === day;

              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.cell}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dayBubble,
                      isSelected && styles.dayBubbleSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isSelected && styles.dayNumberSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions Bottom Bar */}
          <View style={styles.actionsBar}>
            <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.actionBtn}>
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerBanner: {
    backgroundColor: "#111827",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerYear: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerDate: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 4,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  arrowsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  arrowButton: {
    padding: 4,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4B5563",
  },
  dayHeadersRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  dayHeaderLetter: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  cell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  dayBubbleSelected: {
    backgroundColor: "#111827",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  dayNumberSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    gap: 20,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4B5563",
    letterSpacing: 0.5,
  },
  okText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    letterSpacing: 0.5,
  },
});
