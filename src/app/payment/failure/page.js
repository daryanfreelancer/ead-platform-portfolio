'use client'

import { XCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import Button from '@/components/ui/button'

export default function PaymentFailure() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Not Approved
          </h1>
          <p className="text-gray-600">
            There was a problem processing your payment.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">
            Possible causes:
          </h3>
          <ul className="text-sm text-red-700 space-y-1 text-left">
            <li>• Incorrect card details</li>
            <li>• Insufficient limit</li>
            <li>• Temporary operator issue</li>
            <li>• Blocked or expired card</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          
          <Link href="/student">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">
            Need help?
          </h4>
          <p className="text-sm text-blue-700">
            Contact us via email: 
            <a href="mailto:atendimento@eduplatform.com.br" className="underline">
              atendimento@eduplatform.com.br
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}