/**
 * Converts a time string from 12-hour format (e.g., "6:03 PM") to 24-hour format (e.g., "18:03").
 * Handles AM/PM periods and ensures hours and minutes are zero-padded to two digits.
 *
 * @param {string} time12h - The time in 12-hour format, e.g., "6:03 PM" or "12:00 AM".
 *                           Must include hours, minutes, and AM/PM separated by spaces and a colon.
 * @returns {string} The time in 24-hour format, e.g., "18:03" or "00:00", with hours and minutes as two digits.
 * @example
 * convertTo24Hour("6:03 PM"); // Returns "18:03"
 * convertTo24Hour("12:00 AM"); // Returns "00:00"
 * convertTo24Hour("12:00 PM"); // Returns "12:00"
 * convertTo24Hour("9:45 AM"); // Returns "09:45"
 * @throws {Error} If the input format is invalid (e.g., missing AM/PM or incorrect separators).
 */
export const convertTo24Hour = (time12h: string): string => {
  // Split the time into components (e.g., "6:03 PM" -> ["6:03", "PM"])
  const [time, period] = time12h.split(" ");

  // Validate input
  if (!time || !period || !["AM", "PM"].includes(period.toUpperCase())) {
    throw new Error(
      "Invalid time format. Expected 'H:MM AM/PM' or 'HH:MM AM/PM'."
    );
  }

  // Split the time into hours and minutes (e.g., "6:03" -> ["6", "03"])
  const [hoursStr, minutes] = time.split(":");

  if (!hoursStr || !minutes) {
    throw new Error("Invalid time format. Missing hours or minutes.");
  }

  let hours = parseInt(hoursStr, 10);

  // Validate hours and minutes
  if (isNaN(hours) || hours < 1 || hours > 12 || !/^\d{2}$/.test(minutes)) {
    throw new Error("Invalid hours (1-12) or minutes (00-59).");
  }

  // Adjust hours based on AM/PM
  if (period.toUpperCase() === "PM" && hours !== 12) {
    hours += 12; // e.g., 6 PM -> 18
  } else if (period.toUpperCase() === "AM" && hours === 12) {
    hours = 0; // 12 AM -> 00
  }

  // Format as 24-hour string with leading zeros
  const hours24 = String(hours).padStart(2, "0");
  const minutes24 = minutes.padStart(2, "0"); // Ensure minutes are two digits

  return `${hours24}:${minutes24}`;
};
