"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function TimeInput({ id, value, onChange }: TimeInputProps) {
  // Initialize state from value prop only on first render
  const [initialHour, initialMinute, initialPeriod] = React.useMemo(() => {
    if (!value) return ["", "", "AM"];
    try {
      const [time, ampm] = value.split(" ");
      const [h, m] = time.split(":");
      return [h, m, ampm];
    } catch (error) {
      console.error("Invalid initial time format:", value);
      return ["", "", "AM"];
    }
  }, []); // Empty deps: only runs once on mount

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState(initialPeriod);

  // Send formatted time to parent when any part changes
  useEffect(() => {
    if (!hour || !minute) {
      onChange("");
      return;
    }

    const formattedHour = hour.padStart(2, "0");
    const formattedMinute = minute.padStart(2, "0");
    const formattedTime = `${formattedHour}:${formattedMinute} ${period}`;
    onChange(formattedTime);
  }, [hour, minute, period, onChange]);

  return (
    <div className="flex gap-2">
      <div className="w-20">
        <Input
          id={`${id}-hour`}
          placeholder="HH"
          value={hour}
          onChange={(e) => {
            const val = e.target.value;
            if (
              val === "" ||
              (/^\d+$/.test(val) &&
                Number.parseInt(val) >= 1 &&
                Number.parseInt(val) <= 12)
            ) {
              setHour(val); // Store raw input
            }
          }}
          maxLength={2}
        />
      </div>
      <span className="flex items-center">:</span>
      <div className="w-20">
        <Input
          id={`${id}-minute`}
          placeholder="MM"
          value={minute}
          onChange={(e) => {
            const val = e.target.value;
            if (
              val === "" ||
              (/^\d+$/.test(val) &&
                Number.parseInt(val) >= 0 &&
                Number.parseInt(val) <= 59)
            ) {
              setMinute(val); // Store raw input
            }
          }}
          maxLength={2}
        />
      </div>
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="AM/PM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
