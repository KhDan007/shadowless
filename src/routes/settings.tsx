import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageShell } from "@/components/sentinel/AppShell";
import { Panel, PanelHeader } from "@/components/sentinel/atoms";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Bell, Brain, Lock, Cpu } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Shadowless" }, { name: "description", content: "Workspace preferences and operational toggles." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <PageShell title="Settings" subtitle="Workspace preferences · operator CIB-04">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Section title="Notifications" icon={Bell}>
            <Row label="Critical alerts (push)" desc="Push notifications for critical-risk events" defaultOn />
            <Row label="Daily digest email" desc="08:00 UTC+5 summary of new findings" defaultOn />
            <Row label="Mentions in case notes" desc="Notify when an operator mentions you" />
          </Section>
          <Section title="AI engine" icon={Brain}>
            <Row label="Auto-run inference" desc="Re-score entities every 5 minutes" defaultOn />
            <Row label="Show low-confidence findings" desc="Include matches under 60% confidence" />
            <Row label="Beta: contradiction detector" desc="Flag conflicting evidence pairs" />
          </Section>
          <Section title="Security" icon={Lock}>
            <Row label="Require 2FA on report export" defaultOn />
            <Row label="Auto-lock workspace after 10 min idle" defaultOn />
            <Row label="Mask PII in screenshots" defaultOn />
          </Section>
          <Section title="System" icon={Cpu}>
            <Row label="High-contrast mode" />
            <Row label="Reduce motion" />
            <Row label="Telemetry to MIA-SOC" desc="Anonymised UX telemetry" defaultOn />
          </Section>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-sm border border-[#1f2630] bg-[#0d1117] px-3 py-2 text-[12px] text-[#b8b8b8]">
          <ShieldCheck size={13} className="text-[#ffc94d]" /> Session secured · TLS 1.3 · operator clearance L3
        </div>
      </PageShell>
    </AppShell>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <Panel>
      <PanelHeader title={title} right={<Icon size={13} className="text-[#ffc94d]" />} />
      <div className="divide-y divide-[#1f2630]">{children}</div>
    </Panel>
  );
}

function Row({ label, desc, defaultOn = false }: { label: string; desc?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] text-[#e1e2eb]">{label}</div>
        {desc && <div className="text-[12px] text-[#8b96a3]">{desc}</div>}
      </div>
      <Switch checked={on} onCheckedChange={(v) => { setOn(v); toast(`${label}: ${v ? "on" : "off"}`); }} />
    </div>
  );
}