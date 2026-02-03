"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormInputProps {
  label?: string;
  icon?: LucideIcon;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}

export function FormInput({
  label,
  icon: Icon,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  className,
}: FormInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
          {Icon && <Icon size={14} className="text-zinc-400" />}
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="bg-zinc-100 rounded-2xl overflow-hidden">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
        />
      </div>
    </div>
  );
}

interface FormTextareaProps {
  label?: string;
  icon?: LucideIcon;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
}

export function FormTextarea({
  label,
  icon: Icon,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  className,
}: FormTextareaProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
          {Icon && <Icon size={14} className="text-zinc-400" />}
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="bg-zinc-100 rounded-2xl overflow-hidden">
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base resize-none"
        />
      </div>
    </div>
  );
}

interface DateTimeInputProps {
  label?: string;
  icon?: LucideIcon;
  dateName: string;
  timeName: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function DateTimeInput({
  label,
  icon: Icon,
  dateName,
  timeName,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  className,
}: DateTimeInputProps) {
  // Import Clock icon dynamically to avoid circular dependencies
  const ClockIcon = require("lucide-react").Clock;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
          {Icon && <Icon size={14} className="text-zinc-400" />}
          {label}
        </label>
      )}
      <div className="flex gap-3">
        <div className="flex-1 bg-zinc-100 rounded-2xl overflow-hidden">
          <input
            type="date"
            name={dateName}
            value={dateValue}
            onChange={onDateChange}
            className="w-full px-4 py-4 bg-transparent text-zinc-900 focus:outline-none text-base [color-scheme:light]"
          />
        </div>
        <div className="w-32 bg-zinc-100 rounded-2xl overflow-hidden flex items-center">
          <ClockIcon size={16} className="text-zinc-400 ml-4" />
          <input
            type="time"
            name={timeName}
            value={timeValue}
            onChange={onTimeChange}
            className="w-full px-3 py-4 bg-transparent text-zinc-900 focus:outline-none text-base [color-scheme:light]"
          />
        </div>
      </div>
    </div>
  );
}
