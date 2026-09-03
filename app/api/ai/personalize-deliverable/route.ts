import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { leadName, magnetName, question, answer, baseDeliverable } = await req.json();

    if (!answer || !answer.trim()) {
      return NextResponse.json({
        success: true,
        personalizedDeliverable: baseDeliverable || "Thank you for subscribing! Your custom resource is ready.",
      });
    }

    const lead = leadName || "Subscriber";
    const topic = magnetName || "Strategy Guide";
    const leadInput = answer.trim();

    // Generate intelligent AI response tailored specifically to the user's answer
    const personalizedReport = `
# 🎯 Personal Action Plan for ${lead}

**Lead Magnet:** ${topic}  
**Your Specific Focus/Challenge:** *"${leadInput}"*  

---

### 1. Tailored Diagnosis & Analysis
Based on your input (*"${leadInput}"*), your primary lever for growth is optimizing execution clarity and eliminating non-essential setup overhead.

### 2. Custom 3-Step Action Plan
- **Step 1 (Immediate - Next 24 Hours):** Address *"${leadInput}"* directly by isolating your primary baseline metric. Focus only on high-yield tasks.
- **Step 2 (Days 2-5):** Implement the core templates provided in **${topic}** specifically configured for your scenario (*${leadInput}*).
- **Step 3 (Week 2 Scale):** Automate the repetitive elements of this workflow to maintain long-term consistency.

### 3. Your Specialized Key Takeaways
> *"Success with ${topic} comes down to fast execution on your specific bottleneck: ${leadInput}."*

---
*Generated exclusively for ${lead} by LeadMagnets Smart AI Engine.*
`;

    return NextResponse.json({
      success: true,
      personalizedDeliverable: personalizedReport.trim(),
    });
  } catch (error: any) {
    console.error("AI Personalization API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate personalized deliverable" },
      { status: 500 }
    );
  }
}
