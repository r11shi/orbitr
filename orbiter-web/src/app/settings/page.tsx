"use client"

import { useTheme } from "@/components/providers/theme-provider"
import { SunIcon, MoonIcon, BellIcon, PersonIcon, LockClosedIcon, GearIcon, MixerHorizontalIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { SimulationControl } from "@/components/simulation/simulation-control"


export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [activeTab, setActiveTab] = useState("general")

    const tabs = [
        { id: "general", label: "General", icon: GearIcon },
        { id: "appearance", label: "Appearance", icon: MixerHorizontalIcon },
        { id: "notifications", label: "Notifications", icon: BellIcon },
        { id: "security", label: "Security", icon: LockClosedIcon },
        { id: "account", label: "Account", icon: PersonIcon },
    ]

    return (
        <div className="w-full max-w-none">
            {/* Header */}
            <header className="border-b border-border-subtle px-8 py-6">
                <h1 className="text-xl font-semibold tracking-tight text-text-bright">Settings</h1>
                <p className="text-text-secondary text-sm mt-1">
                    Manage your workspace preferences and configuration.
                </p>
            </header>

            <div className="flex">
                {/* Sidebar Navigation */}
                <nav className="w-56 border-r border-border-subtle min-h-[calc(100vh-120px)] px-4 py-6">
                    <ul className="space-y-1">
                        {tabs.map((tab) => (
                            <li key={tab.id}>
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                        activeTab === tab.id
                                            ? "bg-bg-active text-text-bright font-medium"
                                            : "text-text-secondary hover:text-text-primary hover:bg-bg-active/50"
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Content Area */}
                <div className="flex-1 px-6 py-6 max-w-3xl">
                    {/* General Tab */}
                    {activeTab === "general" && (
                        <div className="space-y-8 animate-fade-in">
                            <section>
                                <h2 className="text-lg font-medium text-text-bright mb-1">General Settings</h2>
                                <p className="text-sm text-text-secondary mb-6">Configure your workspace defaults.</p>

                                <div className="space-y-6">
                                    <SettingRow
                                        title="Workspace Name"
                                        description="The display name for your monitoring instance."
                                        action={
                                            <input
                                                type="text"
                                                defaultValue="Orbitr Production"
                                                className="px-3 py-1.5 text-sm bg-bg-active border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-border-strong w-48"
                                            />
                                        }
                                    />

                                    <SettingRow
                                        title="Default Time Zone"
                                        description="Used for scheduling reports and displaying timestamps."
                                        action={
                                            <select className="px-3 py-1.5 text-sm bg-bg-active border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-border-strong">
                                                <option>UTC</option>
                                                <option>America/New_York</option>
                                                <option>Europe/London</option>
                                                <option>Asia/Tokyo</option>
                                                <option>Asia/Kolkata</option>
                                            </select>
                                        }
                                    />

                                    <SettingRow
                                        title="Data Retention"
                                        description="How long to keep historical event data."
                                        action={
                                            <select className="px-3 py-1.5 text-sm bg-bg-active border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-border-strong">
                                                <option>30 days</option>
                                                <option>60 days</option>
                                                <option>90 days</option>
                                                <option>1 year</option>
                                            </select>
                                        }
                                    />
                                </div>
                            </section>

                            {/* Simulation Control Section */}
                            <section>
                                <h2 className="text-lg font-medium text-text-bright mb-1">System Simulation</h2>
                                <p className="text-sm text-text-secondary mb-6">Control workflow simulation for testing and demonstration.</p>
                                <SimulationControl />
                            </section>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === "appearance" && (
                        <div className="space-y-8 animate-fade-in">
                            <section>
                                <h2 className="text-lg font-medium text-text-bright mb-1">Appearance</h2>
                                <p className="text-sm text-text-secondary mb-6">Customize how Orbitr looks on your device.</p>

                                <div className="space-y-6">
                                    <div className="pb-6 border-b border-border-subtle">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-sm font-medium text-text-bright">Theme</h3>
                                                <p className="text-xs text-text-secondary mt-1">
                                                    Select your interface color scheme.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <button
                                                onClick={() => setTheme("light")}
                                                className={cn(
                                                    "relative p-4 rounded-lg border-2 transition-all",
                                                    theme === "light"
                                                        ? "border-text-bright bg-bg-active"
                                                        : "border-border-subtle hover:border-border-strong"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center">
                                                        <SunIcon className="w-5 h-5 text-zinc-700" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-text-bright">Light</div>
                                                        <div className="text-xs text-text-secondary">Clean and bright</div>
                                                    </div>
                                                </div>
                                                {theme === "light" && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckIcon className="w-4 h-4 text-status-active" />
                                                    </div>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => setTheme("dark")}
                                                className={cn(
                                                    "relative p-4 rounded-lg border-2 transition-all",
                                                    theme === "dark"
                                                        ? "border-text-bright bg-bg-active"
                                                        : "border-border-subtle hover:border-border-strong"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                                                        <MoonIcon className="w-5 h-5 text-zinc-300" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-text-bright">Dark</div>
                                                        <div className="text-xs text-text-secondary">Easy on the eyes</div>
                                                    </div>
                                                </div>
                                                {theme === "dark" && (
                                                    <div className="absolute top-2 right-2">
                                                        <CheckIcon className="w-4 h-4 text-status-active" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <SettingRow
                                        title="Compact Mode"
                                        description="Reduce spacing for more information density."
                                        action={<Toggle defaultChecked={false} />}
                                    />

                                    <SettingRow
                                        title="Show Animations"
                                        description="Enable smooth transitions and micro-animations."
                                        action={<Toggle defaultChecked={true} />}
                                    />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "notifications" && (
                        <div className="space-y-8 animate-fade-in">
                            <section>
                                <h2 className="text-lg font-medium text-text-bright mb-1">Notifications</h2>
                                <p className="text-sm text-text-secondary mb-6">Choose how and when to be notified.</p>

                                <div className="space-y-6">
                                    <SettingRow
                                        title="Critical Alerts"
                                        description="Immediate notification for severity HIGH and CRITICAL events."
                                        action={<Toggle defaultChecked={true} />}
                                    />

                                    <SettingRow
                                        title="Workflow Failures"
                                        description="Alert when monitored workflows enter failed state."
                                        action={<Toggle defaultChecked={true} />}
                                    />

                                    <SettingRow
                                        title="Daily Digest"
                                        description="Summary email of activities sent each morning."
                                        action={<Toggle defaultChecked={false} />}
                                    />

                                    <SettingRow
                                        title="Weekly Reports"
                                        description="Comprehensive weekly compliance and trend report."
                                        action={<Toggle defaultChecked={true} />}
                                    />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === "security" && (
                        <div className="space-y-8 animate-fade-in">
                            <section>
                                <h2 className="text-lg font-medium text-text-bright mb-1">Security & Compliance</h2>
                                <p className="text-sm text-text-secondary mb-6">Manage security settings and access controls.</p>

                                <div className="space-y-6">
                                    <div className="p-4 rounded-lg bg-status-active/10 border border-status-active/20">
                                        <div className="flex items-center gap-3">
                                            <CheckIcon className="w-5 h-5 text-status-active" />
                                            <div>
                                                <div className="text-sm font-medium text-text-bright">Two-Factor Authentication</div>
                                                <div className="text-xs text-text-secondary">Enabled for this account</div>
                                            </div>
                                        </div>
                                    </div>

                                    <SettingRow
                                        title="Session Timeout"
                                        description="Automatically log out after inactivity."
                                        action={
                                            <select className="px-3 py-1.5 text-sm bg-bg-active border border-border-subtle rounded-md text-text-primary focus:outline-none focus:border-border-strong">
                                                <option>15 minutes</option>
                                                <option>30 minutes</option>
                                                <option>1 hour</option>
                                                <option>4 hours</option>
                                            </select>
                                        }
                                    />

                                    <SettingRow
                                        title="API Key Access"
                                        description="Manage API keys for programmatic access."
                                        action={
                                            <button className="px-3 py-1.5 text-sm bg-bg-active border border-border-subtle rounded-md text-text-primary hover:bg-bg-panel transition-colors">
                                                Manage Keys
                                            </button>
                                        }
                                    />

                                    <SettingRow
                                        title="Audit Log Retention"
                                        description="Security logs are retained for compliance."
                                        action={
                                            <span className="text-sm font-mono text-text-secondary">90 days</span>
                                        }
                                    />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Account Tab */}
                    {activeTab === "account" && (
                        <div className="space-y-8 animate-fade-in">
                            <section>
                                <h2 className="text-lg font-medium text-text-bright mb-1">Account</h2>
                                <p className="text-sm text-text-secondary mb-6">Manage your personal account details.</p>

                                <div className="flex items-center gap-4 p-4 border border-border-subtle rounded-lg mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-brand/20 to-accent-brand/5 flex items-center justify-center text-text-bright font-medium">
                                        AS
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-text-bright">Admin User</div>
                                        <div className="text-xs text-text-secondary">admin@orbitr.io</div>
                                    </div>
                                    <button className="ml-auto text-xs text-text-secondary hover:text-text-primary">
                                        Edit Profile
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <SettingRow
                                        title="Email Address"
                                        description="Primary email for notifications and recovery."
                                        action={
                                            <span className="text-sm text-text-secondary font-mono">admin@orbitr.io</span>
                                        }
                                    />

                                    <SettingRow
                                        title="Role"
                                        description="Your access level in this workspace."
                                        action={
                                            <span className="text-xs font-medium text-text-bright bg-bg-active px-2 py-1 rounded">Administrator</span>
                                        }
                                    />
                                </div>

                                <div className="mt-8 pt-6 border-t border-border-subtle">
                                    <button className="px-4 py-2 text-sm text-status-alert hover:bg-status-alert/10 rounded-md transition-colors">
                                        Sign Out
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Reusable Setting Row Component
function SettingRow({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
            <div className="pr-4">
                <h3 className="text-sm font-medium text-text-bright">{title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{description}</p>
            </div>
            {action}
        </div>
    )
}

// Toggle Component
function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
    const [checked, setChecked] = useState(defaultChecked)

    return (
        <button
            onClick={() => setChecked(!checked)}
            className={cn(
                "relative w-10 h-6 rounded-full transition-colors",
                checked ? "bg-status-active" : "bg-bg-active border border-border-subtle"
            )}
        >
            <div
                className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-5" : "translate-x-1"
                )}
            />
        </button>
    )
}
