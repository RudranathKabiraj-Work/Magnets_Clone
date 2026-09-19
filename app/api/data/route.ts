import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel, MagnetPageModel, LeadModel, SequenceModel, IntegrationModel, ResourceModel } from "@/lib/models";
import { getAuthenticatedUserEmail } from "@/lib/auth";
import {
  handleSaveAccount,
  handleCheckEmail,
  handleDeleteAccount,
  handleLogin,
  handleUpdatePassword,
  handleGetAccountByEmail,
  handleSendResetEmail,
  handleResetPassword,
  handleSendVerificationEmail,
} from "@/lib/controllers/account";
import {
  handleSavePages,
  handleAddPage,
  handleDeletePage,
  handleIncrementViews,
  handleSaveSequences,
  handleDeleteSequence,
} from "@/lib/controllers/magnets";
import {
  handleAddLead,
  handleDeleteLead,
  handleSaveLeads,
  handleSendTestLeadAlert,
  handleResendLeadEmail,
} from "@/lib/controllers/leads";
import {
  handleSaveIntegrations,
  handleSaveResources,
  handleDeleteResource,
  handleAddResource,
  handleSendTestKitAlert,
  handleSendTestPipedriveAlert,
  handleSendTestZapierAlert,
  handleSendTestSlackAlert,
} from "@/lib/controllers/integrations";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const authEmail = await getAuthenticatedUserEmail();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const normEmail = authEmail || (email ? email.trim().toLowerCase() : null);

    if (!normEmail) {
      return NextResponse.json({
        account: null,
        pages: [],
        leads: [],
        sequences: [],
        integrations: [],
        resources: [],
      });
    }

    const pageFilter = { userEmail: normEmail };
    const userFilter = { userEmail: normEmail };

    const [account, pages, leads, sequences, integrations, resources] = await Promise.all([
      AccountModel.findOne({ email: normEmail }).select("-password").lean(),
      MagnetPageModel.find(pageFilter).lean(),
      LeadModel.find(userFilter).lean(),
      SequenceModel.find(userFilter).lean(),
      IntegrationModel.find(userFilter).lean(),
      ResourceModel.find({ userEmail: normEmail, isPageAsset: { $ne: true }, type: { $ne: "page_asset" } }).lean(),
    ]);

    let finalLeads = leads;
    if (pages.length > 0) {
      const pageNames = (pages as any[]).map((p) => p.name).filter(Boolean);
      const pageIds = (pages as any[]).map((p) => p.id).filter(Boolean);
      const fallbackLeads = await LeadModel.find({
        $or: [
          { userEmail: normEmail },
          { pageId: { $in: pageIds } },
          { page: { $in: pageNames } },
        ],
      }).lean();
      finalLeads = fallbackLeads;
    }

    return NextResponse.json({
      account,
      pages,
      leads: finalLeads,
      sequences,
      integrations,
      resources,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { action, data, email } = body;

    const publicActions = [
      "addLead",
      "checkEmail",
      "login",
      "resetPassword",
      "sendResetEmail",
      "sendVerificationEmail",
      "sendForgotPasswordEmail",
      "verifyEmailToken",
    ];

    const isPublic = publicActions.includes(action);
    const authEmail = isPublic ? null : await getAuthenticatedUserEmail();
    const normEmail = authEmail || (email ? email.trim().toLowerCase() : (body.userEmail || "").trim().toLowerCase());

    if (!normEmail && !isPublic && action !== "saveAccount") {
      return NextResponse.json({ error: "Unauthorized. Please log in to perform this action." }, { status: 401 });
    }

    // Dispatch to modular controllers (Facade Router)
    switch (action) {
      // Account Controller
      case "saveAccount":
        return handleSaveAccount(data, authEmail);
      case "checkEmail": {
        // Rate-limit email existence checks to prevent user enumeration attacks.
        // 10 requests per 60 seconds per IP is generous for legitimate use (e.g.
        // typing an email into the register form) but stops bulk enumeration scripts.
        const rlIp =
          (req as any).headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
          (req as any).headers?.get?.("x-real-ip") ||
          "unknown";
        const rl = await checkRateLimit(rlIp, "check_email", 10, 60 * 1000);
        if (!rl.success) {
          return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            { status: 429 }
          );
        }
        return handleCheckEmail(data);
      }
      case "deleteAccount":
        return handleDeleteAccount(data, authEmail);
      case "login":
        return handleLogin(data);
      case "updatePassword":
        return handleUpdatePassword(data, authEmail);
      case "getAccountByEmail":
        return handleGetAccountByEmail(authEmail);
      case "sendResetEmail":
      case "sendForgotPasswordEmail":
        return handleSendResetEmail(data);
      case "resetPassword":
        return handleResetPassword(data);
      case "sendVerificationEmail":
        const reqHost = req.headers.get("origin") || "http://localhost:3000";
        return handleSendVerificationEmail(data, reqHost);

      // Magnets Controller
      case "savePages":
        return handleSavePages(data, normEmail);
      case "addPage":
        return handleAddPage(data, normEmail);
      case "deletePage":
        return handleDeletePage(data, normEmail);
      case "incrementViews":
        return handleIncrementViews(data);
      case "saveSequences":
        return handleSaveSequences(data, normEmail);
      case "deleteSequence":
        return handleDeleteSequence(data, normEmail);

      // Leads Controller
      case "addLead":
        return handleAddLead(data, req, normEmail);
      case "deleteLead":
        return handleDeleteLead(data, normEmail);
      case "saveLeads":
        return handleSaveLeads(data, normEmail);
      case "sendTestLeadAlert":
        return handleSendTestLeadAlert(data, normEmail);
      case "resendLeadEmail":
        return handleResendLeadEmail(data, normEmail);

      // Integrations & Resources Controller
      case "saveIntegrations":
        return handleSaveIntegrations(data, normEmail);
      case "saveResources":
        return handleSaveResources(data, normEmail);
      case "deleteResource":
        return handleDeleteResource(data, normEmail);
      case "addResource":
        return handleAddResource(data);
      case "sendTestKitAlert":
        return handleSendTestKitAlert(data, normEmail);
      case "sendTestPipedriveAlert":
        return handleSendTestPipedriveAlert(data, normEmail);
      case "sendTestZapierAlert":
        return handleSendTestZapierAlert(data, normEmail);
      case "sendTestSlackAlert":
        return handleSendTestSlackAlert(data, normEmail);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
