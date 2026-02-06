"use client"

import { useState } from "react"
import { GearIcon, BellIcon, LockIcon, UserIcon } from "@radix-ui/react-icons"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    systemAlerts: true,
    securityNotifications: true,
    autoRemediation: true,
    dataRetention: "90days",
  })

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const settingSections = [
    {
      title: "Notifications",
      icon: BellIcon,
      items: [
        { key: "systemAlerts", label: "System Alerts", description: "Receive notifications for critical system events" },
        { key: "securityNotifications", label: "Security Alerts", description: "Alerts for security-related incidents" },
      ]
    },
    {
      title: "Automation",
      icon: GearIcon,
      items: [
        { key: "autoRemediation", label: "Auto Remediation", description: "Automatically apply remediation actions" },
      ]
    },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-b from-bg-void to-bg-panel/20">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
          {/* Header */}
          <header className="flex flex-col gap-2 border-b border-border-subtle pb-8">
            <h1 className="text-3xl font-medium tracking-tight text-text-bright">Settings</h1>
            <p className="text-text-secondary text-sm">
              Configure system behavior and preferences.
            </p>
          </header>

          {/* Settings Sections */}
          <div className="space-y-6">
            {settingSections.map((section) => {
              const Icon = section.icon
              return (
                <div key={section.title} className="border border-border-subtle rounded-lg bg-bg-panel overflow-hidden">
                  {/* Section Header */}
                  <div className="px-6 py-4 bg-bg-active/30 border-b border-border-subtle flex items-center gap-3">
                    <Icon className="w-5 h-5 text-text-secondary" />
                    <h2 className="font-medium text-text-bright">{section.title}</h2>
                  </div>

                  {/* Settings Items */}
                  <div className="divide-y divide-border-subtle">
                    {section.items.map((item) => (
                      <div key={item.key} className="px-6 py-4 flex items-center justify-between hover:bg-bg-active/20 transition-colors">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-text-bright">{item.label}</h3>
                          <p className="text-xs text-text-secondary mt-1">{item.description}</p>
                        </div>
                        <button
                          onClick={() => toggleSetting(item.key)}
                          className={`ml-4 w-12 h-6 rounded-full transition-colors relative ${
                            settings[item.key as keyof typeof settings] ? 'bg-status-active' : 'bg-bg-active border border-border-subtle'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-bg-void transition-all ${
                            settings[item.key as keyof typeof settings] ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Data Retention */}
          <div className="border border-border-subtle rounded-lg bg-bg-panel p-6">
            <h2 className="font-medium text-text-bright mb-4">Data Retention</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded border border-border-subtle hover:bg-bg-active/20 cursor-pointer transition-colors">
                <input type="radio" name="retention" value="30days" className="w-4 h-4" defaultChecked={settings.dataRetention === "30days"} onChange={(e) => setSettings({...settings, dataRetention: e.target.value})} />
                <span className="text-sm text-text-primary">30 days</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded border border-border-subtle hover:bg-bg-active/20 cursor-pointer transition-colors">
                <input type="radio" name="retention" value="90days" className="w-4 h-4" defaultChecked={settings.dataRetention === "90days"} onChange={(e) => setSettings({...settings, dataRetention: e.target.value})} />
                <span className="text-sm text-text-primary">90 days (default)</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded border border-border-subtle hover:bg-bg-active/20 cursor-pointer transition-colors">
                <input type="radio" name="retention" value="1year" className="w-4 h-4" defaultChecked={settings.dataRetention === "1year"} onChange={(e) => setSettings({...settings, dataRetention: e.target.value})} />
                <span className="text-sm text-text-primary">1 year</span>
              </label>
            </div>
          </div>

          {/* System Info */}
          <div className="border border-border-subtle rounded-lg bg-bg-panel p-6 space-y-3">
            <h2 className="font-medium text-text-bright mb-4">System Information</h2>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-xs font-mono text-text-dim uppercase block mb-1">Version</span>
                <span className="text-text-primary">v4.0.0</span>
              </div>
              <div>
                <span className="text-xs font-mono text-text-dim uppercase block mb-1">Environment</span>
                <span className="text-text-primary">Production</span>
              </div>
              <div>
                <span className="text-xs font-mono text-text-dim uppercase block mb-1">API Endpoint</span>
                <span className="text-text-primary font-mono text-xs">api.orbitr.dev/v1</span>
              </div>
              <div>
                <span className="text-xs font-mono text-text-dim uppercase block mb-1">Status</span>
                <span className="text-status-active">Operational</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t border-border-subtle">
            <button className="px-4 py-2 bg-status-active text-bg-void rounded font-medium text-sm hover:opacity-90 transition-opacity">
              Save Changes
            </button>
            <button className="px-4 py-2 border border-border-subtle rounded font-medium text-sm text-text-primary hover:bg-bg-active/30 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
