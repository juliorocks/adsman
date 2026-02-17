
"use client"

import * as React from "react"
import { Check } from "lucide-react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
    checked?: boolean
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => {
        return (
            <div
                className={`h-5 w-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${checked
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-white border-slate-300 hover:border-emerald-400'
                    } ${className}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onCheckedChange?.(!checked);
                }}
            >
                {checked && <Check className="h-4 w-4 stroke-[3px]" />}
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => { }} // Controlled by div click
                    ref={ref}
                    {...props}
                />
            </div>
        )
    }
)
Checkbox.displayName = "Checkbox"
