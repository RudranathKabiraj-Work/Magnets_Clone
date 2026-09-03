import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { topic, targetAudience, format, tone } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const cleanTopic = topic.trim();
    const audience = targetAudience?.trim() || "creators and founders";
    const selectedFormat = format || "Interactive Checklist";

    const title = `${cleanTopic.replace(/^(the|a|an)\s+/i, "")} Strategy Blueprint`;
    const headline = `Master ${cleanTopic} in Under 10 Minutes (Step-by-Step ${selectedFormat})`;
    const subheadline = `Get the exact ${selectedFormat.toLowerCase()} engineered specifically for ${audience} to cut setup time in half and drive measurable results today.`;
    const cta = `Claim Your Free ${selectedFormat.split(" ")[0]} Now`;

    const deliverable = `### 🚀 What's Inside:
- **Phase 1: Foundation Setup**: Core principles & mistake elimination framework.
- **Phase 2: Execution Checklist**: 7 actionable steps tailored for ${audience}.
- **Phase 3: High-ROI Automation**: Bonus copy templates and automation triggers.
- **Bonus Resource**: Pre-formatted Google Sheet / Notion workspace download.`;

    const pitch = `Stop wasting hours guessing how to scale ${cleanTopic}. This battle-tested resource breaks down the exact workflow used by top 1% ${audience}.`;

    const bullets = [
      `100% actionable framework built specifically for ${audience}`,
      `Includes pre-built copy-paste templates and workflow checklists`,
      `Zero fluff: designed to give you implementation results within 24 hours`
    ];

    const emails = [
      {
        id: `em_${Date.now()}_1`,
        subject: `[Access Granted] Here is your ${cleanTopic} ${selectedFormat}`,
        delayLabel: "Immediate",
        delayMinutes: 0,
        status: "live" as const,
        sent: 1,
        opened: 1
      },
      {
        id: `em_${Date.now()}_2`,
        subject: `The #1 mistake ${audience} make with ${cleanTopic}`,
        delayLabel: "1 day after signup",
        delayMinutes: 1440,
        status: "live" as const,
        sent: 0,
        opened: 0
      },
      {
        id: `em_${Date.now()}_3`,
        subject: `Quick check-in + bonus workflow tool`,
        delayLabel: "3 days after signup",
        delayMinutes: 4320,
        status: "draft" as const,
        sent: 0,
        opened: 0
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        name: title,
        headline,
        subheadline,
        cta,
        deliverable,
        pitch,
        bullets,
        accent: "#FE6F34",
        template: selectedFormat.toLowerCase().includes("video") ? "video" : "classic",
        emails
      }
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate AI lead magnet" }, { status: 500 });
  }
}
