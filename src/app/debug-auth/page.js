'use client'
import { useEffect, useState } from 'react'

export default function DebugAuth() {
  const [info, setInfo] = useState({})

  useEffect(() => {
    setInfo({
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      hashParams: Object.fromEntries(new URLSearchParams(window.location.hash.substring(1))),
      searchParams: Object.fromEntries(new URLSearchParams(window.location.search)),
    })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Auth Info</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  )
}