// Currency formatting utility for Kenyan Shillings
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
  
  // Alternative format without currency symbol (just KES prefix)
  export const formatKES = (amount) => {
    return `KES ${Number.parseFloat(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  
  // Parse currency input (remove KES and commas)
  export const parseCurrency = (value) => {
    if (typeof value === "string") {
      return Number.parseFloat(value.replace(/[KES,\s]/g, "")) || 0
    }
    return Number.parseFloat(value) || 0
  }
  
  // Format for input fields (without currency symbol)
  export const formatInputCurrency = (amount) => {
    return Number.parseFloat(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  