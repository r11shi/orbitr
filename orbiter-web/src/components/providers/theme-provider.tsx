"use client"

import * as React from "react"

const ThemeContext = React.createContext<{
    theme: "light" | "dark"
    setTheme: (theme: "light" | "dark") => void
}>({
    theme: "dark",
    setTheme: () => null,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = React.useState<"light" | "dark">("dark")

    React.useEffect(() => {
        // Check local storage or preference
        const saved = localStorage.getItem("orbitr-theme") as "light" | "dark"
        if (saved) {
            setTheme(saved)
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark")
        } else {
            setTheme("light")
        }
    }, [])

    React.useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
        localStorage.setItem("orbitr-theme", theme)
    }, [theme])

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => React.useContext(ThemeContext)
