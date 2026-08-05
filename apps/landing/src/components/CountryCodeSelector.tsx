import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { countries } from "@/data/countries";

interface CountryCodeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isDark?: boolean;
}

export function CountryCodeSelector({
  value,
  onChange,
  className,
  isDark,
}: CountryCodeSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const selectedCountry =
    countries.find((c) => c.dial_code === value) || countries[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-body text-sm px-3",
            isDark ? "bg-muted/30 border-border" : "bg-muted border-border",
            className,
          )}
        >
          <span className="flex items-center gap-2">
            <span className="text-base shrink-0">{selectedCountry.flag}</span>
            <span className="shrink-0">{selectedCountry.dial_code}</span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country or code..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={`${country.code}-${country.dial_code}`}
                  value={`${country.name} ${country.dial_code} ${country.code}`}
                  onSelect={() => {
                    onChange(country.dial_code);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.dial_code ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                  <span className="ml-auto text-muted-foreground text-xs">
                    {country.dial_code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
