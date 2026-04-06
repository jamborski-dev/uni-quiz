"use client"

import { useState, useEffect } from "react"

export type Platform = "ios" | "firefox" | "chrome" | "other"

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("other")

  useEffect(() => {
    const ua = navigator.userAgent
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) &&
      !(window.navigator as { standalone?: boolean }).standalone
    const isFirefox = /Firefox/.test(ua)
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua)
    const isEdge = /Edg/.test(ua)

    if (isIOS) setPlatform("ios")
    else if (isFirefox) setPlatform("firefox")
    else if (isChrome || isEdge) setPlatform("chrome")
    else setPlatform("other")
  }, [])

  return platform
}
