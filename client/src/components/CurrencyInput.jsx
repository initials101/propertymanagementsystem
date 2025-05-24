"use client"

import { useState, useEffect } from "react"
import { formatInputCurrency, parseCurrency } from "../utils/currency"

export default function CurrencyInput({ value, onChange, placeholder = "0.00", className = "", ...props }) {
  const [displayValue, setDisplayValue] = useState("")

  useEffect(() => {
    if (value) {
      setDisplayValue(formatInputCurrency(value))
    } else {
      setDisplayValue("")
    }
  }, [value])

  const handleChange = (e) => {
    const inputValue = e.target.value

    // Remove all non-numeric characters except decimal point
    const numericValue = inputValue.replace(/[^0-9.]/g, "")

    // Ensure only one decimal point
    const parts = numericValue.split(".")
    const formattedValue = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : numericValue

    setDisplayValue(formattedValue)

    // Pass the numeric value to parent
    const numericAmount = parseCurrency(formattedValue)
    onChange(numericAmount)
  }

  const handleBlur = () => {
    if (displayValue && !isNaN(parseCurrency(displayValue))) {
      setDisplayValue(formatInputCurrency(parseCurrency(displayValue)))
    }
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 text-sm">KES</span>
      </div>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`input pl-12 ${className}`}
        {...props}
      />
    </div>
  )
}
