"use client"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon"
import { SunIcon } from "@/components/tiptap-icons/sun-icon"

export function ThemeToggle() {
  const toggleDarkMode = () => {
    // Disabled - always use light mode
  }

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label="Light mode"
      variant="ghost"
      disabled
    >
      <SunIcon className="tiptap-button-icon" />
    </Button>
  )
}