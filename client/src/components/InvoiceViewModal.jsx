"use client"

import { X, Download, Send, DollarSign } from "lucide-react"
import { formatKSh } from "../utils/currency"

export default function InvoiceViewModal({ isOpen, onClose, invoice, onStatusChange }) {
  if (!isOpen || !invoice) return null

  const handleStatusChange = (newStatus) => {
    onStatusChange(invoice.id, newStatus)
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const lineItems = invoice.line_items?.items || []

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Invoice {invoice.invoice_number}</h3>
            <div className="flex items-center space-x-4">
              {/* Status Actions */}
              {invoice.status === "draft" && (
                <button onClick={() => handleStatusChange("sent")} className="btn btn-outline btn-sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </button>
              )}
              {invoice.status === "sent" && (
                <button onClick={() => handleStatusChange("paid")} className="btn btn-outline btn-sm text-green-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Mark Paid
                </button>
              )}
              <button onClick={handlePrint} className="btn btn-outline btn-sm">
                <Download className="h-4 w-4 mr-2" />
                Print
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8 print:p-0">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-lg text-gray-600 mt-2">{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
                <div className="text-gray-700">
                  <p className="font-medium">{invoice.tenant_name}</p>
                  <p>{invoice.tenant_email}</p>
                  {invoice.tenant_phone && <p>{invoice.tenant_phone}</p>}
                  {invoice.tenant_address && <p className="mt-2">{invoice.tenant_address}</p>}
                  {invoice.unit_number && (
                    <p className="mt-2">
                      <span className="font-medium">Unit:</span> {invoice.unit_number}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details:</h3>
                <div className="text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Issue Date:</span>
                    <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                  {invoice.payment_terms && (
                    <div className="flex justify-between">
                      <span>Payment Terms:</span>
                      <span>{invoice.payment_terms}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description:</h3>
                <p className="text-gray-700">{invoice.description}</p>
              </div>
            )}

            {/* Line Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left">Description</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Qty</th>
                      <th className="border border-gray-300 px-4 py-3 text-right">Rate</th>
                      <th className="border border-gray-300 px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-3">{item.description}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right">{formatKSh(item.rate)}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                          {formatKSh(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatKSh(invoice.amount)}</span>
                  </div>
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatKSh(invoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatKSh(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes:</h3>
                <p className="text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm border-t pt-4">
              <p>Thank you for your business!</p>
              <p className="mt-2">This invoice was generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
