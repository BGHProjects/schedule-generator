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
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [period, setPeriod] = useState("AM");

  // Parse the time string when the value prop changes

  useEffect(() => {
    if (!value) {
      setHour("");
      setMinute("");
      setPeriod("AM");
      return;
    }

    try {
      const [time, ampm] = value.split(" ");
      const [h, m] = time.split(":");
      setHour(h);
      setMinute(m);
      setPeriod(ampm);
    } catch (error) {
      // Handle invalid time format

      console.error("Invalid time format:", value);
    }
  }, [value]);

  // Update the parent component when any part of the time changes

  useEffect(() => {
    if (!hour || !minute) {
      onChange("");
      return;
    }

    const formattedTime = `${hour}:${minute} ${period}`;

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
              setHour(val);
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
              setMinute(val.padStart(2, "0"));
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
