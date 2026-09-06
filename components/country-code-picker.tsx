"use client";

import { COUNTRY_CODES } from "@/lib/countries";

type CountryCodePickerProps = {
  value?: string; // dialCode e.g. "+91"
  onChange?: (dialCode: string) => void;
};

export function CountryCodePicker({ value = "+91" }: CountryCodePickerProps) {
  const selectedCountry =
    COUNTRY_CODES.find((c) => c.dialCode === value) || COUNTRY_CODES[0];

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 rounded-[8px] border border-[#e3e8f4] bg-white px-3 text-sm font-semibold text-[#202638] shadow-2xs select-none">
      <img
        src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
        alt={selectedCountry.name}
        className="h-3.5 w-5 rounded-[2px] object-cover shadow-xs"
      />
      <span>{selectedCountry.dialCode}</span>
    </div>
  );
}
