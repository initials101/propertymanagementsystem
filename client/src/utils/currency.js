// Currency formatting utility for Kenyan Shillings
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format with KSh prefix (more commonly used in Kenya)
export const formatKSh = (amount) => {
  if (!amount && amount !== 0) return "KSh 0.00"
  return `KSh ${Number.parseFloat(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Format for compact display (without decimals for whole numbers)
export const formatKShCompact = (amount) => {
  if (!amount && amount !== 0) return "KSh 0"
  const num = Number.parseFloat(amount)
  if (num % 1 === 0) {
    return `KSh ${num.toLocaleString("en-KE")}`
  }
  return `KSh ${num.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Parse currency input (remove KSh and commas)
export const parseCurrency = (value) => {
  if (typeof value === "string") {
    return Number.parseFloat(value.replace(/[KSh,\s]/g, "")) || 0
  }
  return Number.parseFloat(value) || 0
}

// Format for input fields (without currency symbol)
export const formatInputCurrency = (amount) => {
  if (!amount && amount !== 0) return ""
  return Number.parseFloat(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Format for display in tables and cards
export const formatKShDisplay = (amount) => {
  if (!amount && amount !== 0) return "KSh 0.00"
  return `KSh ${Number.parseFloat(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
