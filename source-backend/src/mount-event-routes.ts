import express from "express";
import multer from "multer";
import { requireApiKey } from "./middleware/requireApiKey.js";
import { usersRouter } from "./routes/users.js";
import {
  postStripeWebhook,
  postCreatePaymentIntent,
  postCreateCheckoutSession,
  getFulfillCheckoutSession,
} from "./api/stripe-handlers.js";
import {
  getPaymentAsiaConfig,
  postCreatePaymentAsiaPayment,
  postPaymentAsiaNotify,
} from "./api/paymentasia-handlers.js";
import { getStripePublishableConfig } from "./api/stripe-publishable-config-handler.js";
import {
  postAdminLogin,
  postAdminLogout,
  getBankSlipImage,
  getRegistrationEmailDocument,
  headRegistrationEmailDocument,
  getAdminEmails,
  postAdminEmailsSend,
  getAdminApprovals,
  postAdminApprovals,
  getAdminApprovalRegistrations,
  postAdminApprovalDecision,
  getAdminBankTransfers,
  postAdminBankVerify,
  postAdminConfirmRegistration,
  postAdminUpdateStage,
} from "./api/admin-handlers.js";
import {
  postAcknowledge,
  postCommitForPayment,
  postComplete,
  postBankSlip,
  getRegistrationThankYouSummary,
  getRegistrationDraft,
} from "./api/registration-handlers.js";
import {
  postNotificationQueueProcess,
  postEmailQueueProcess,
} from "./api/internal-handlers.js";
import {
  getCrmRegistrationsExport,
  getCrmRegistrationsList,
  getCrmRegistrationDetail,
} from "./api/crm-handlers.js";
import {
  getAdminRuntimeConfig,
  patchAdminRuntimeConfig,
} from "./api/runtime-config-handlers.js";
import {
  getAdminMe,
  getAdminUser,
  getAdminUsers,
  patchAdminUser,
  postAdminUsers,
} from "./api/admin-users-handlers.js";
import { getAdminRegistrationAdminDetail } from "./api/admin-registration-detail-handlers.js";
import { getAdminEmailTemplatePreview } from "./api/admin-email-template-preview-handlers.js";
import { patchAdminRegistrationRegistrantInfo } from "./api/admin-registrant-payload-handlers.js";
import { getDiscountPreview } from "./api/discount-handlers.js";
import {
  getCheckInLookup,
  postCheckInRecord,
} from "./api/admin-check-in-handlers.js";
import { adminBulkEmailSendLimiter, apiLimiter } from "./middleware/rate-limit.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

/**
 * Event RSVP HTTP API (migrated from Next.js `web/src/app/api`).
 * Stripe webhook must use raw body (registered before `express.json`).
 */
export function mountEventRoutes(app: express.Express): void {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      void postStripeWebhook(req, res).catch(next);
    },
  );

  app.post(
    "/api/paymentasia/notify",
    express.urlencoded({ extended: true, limit: "256kb" }),
    (req, res, next) => {
      void postPaymentAsiaNotify(req, res).catch(next);
    },
  );

  const jsonParser = express.json({ limit: "4mb" });
  app.use(jsonParser);
  app.use(apiLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "source-backend" });
  });

  app.get("/api/stripe/publishable-config", (req, res, next) => {
    void getStripePublishableConfig(req, res).catch(next);
  });

  app.get("/api/discount/preview", (req, res, next) => {
    void getDiscountPreview(req, res).catch(next);
  });

  app.post("/api/stripe/create-payment-intent", (req, res, next) => {
    void postCreatePaymentIntent(req, res).catch(next);
  });
  app.post("/api/stripe/create-checkout-session", (req, res, next) => {
    void postCreateCheckoutSession(req, res).catch(next);
  });
  app.get("/api/paymentasia/config", (req, res, next) => {
    void getPaymentAsiaConfig(req, res).catch(next);
  });
  app.post("/api/paymentasia/create-payment", (req, res, next) => {
    void postCreatePaymentAsiaPayment(req, res).catch(next);
  });
  app.get("/api/stripe/fulfill-checkout-session", (req, res, next) => {
    void getFulfillCheckoutSession(req, res).catch(next);
  });

  app.post("/api/admin/auth/login", (req, res, next) => {
    void postAdminLogin(req, res).catch(next);
  });
  app.post("/api/admin/auth/logout", (req, res, next) => {
    void postAdminLogout(req, res).catch(next);
  });

  app.get("/api/admin/bank-slips/image", (req, res, next) => {
    void getBankSlipImage(req, res).catch(next);
  });
  app.get("/api/admin/registration-documents", (req, res, next) => {
    void getRegistrationEmailDocument(req, res).catch(next);
  });
  app.head("/api/admin/registration-documents", (req, res, next) => {
    void headRegistrationEmailDocument(req, res).catch(next);
  });
  app.get("/api/admin/emails", (req, res, next) => {
    void getAdminEmails(req, res).catch(next);
  });
  app.post(
    "/api/admin/emails/send",
    adminBulkEmailSendLimiter,
    (req, res, next) => {
      void postAdminEmailsSend(req, res).catch(next);
    },
  );
  app.get("/api/admin/runtime-config", (req, res, next) => {
    void getAdminRuntimeConfig(req, res).catch(next);
  });
  app.patch("/api/admin/runtime-config", (req, res, next) => {
    void patchAdminRuntimeConfig(req, res).catch(next);
  });

  app.get("/api/admin/me", (req, res, next) => {
    void getAdminMe(req, res).catch(next);
  });

  app.get("/api/admin/users", (req, res, next) => {
    void getAdminUsers(req, res).catch(next);
  });
  app.get("/api/admin/users/:id", (req, res, next) => {
    void getAdminUser(req, res).catch(next);
  });
  app.post("/api/admin/users", (req, res, next) => {
    void postAdminUsers(req, res).catch(next);
  });
  app.patch("/api/admin/users/:id", (req, res, next) => {
    void patchAdminUser(req, res).catch(next);
  });

  app.get(
    "/api/admin/registrations/:reference/admin-detail",
    (req, res, next) => {
      void getAdminRegistrationAdminDetail(req, res).catch(next);
    },
  );
  app.get(
    "/api/admin/registrations/:reference/email-template-preview",
    (req, res, next) => {
      void getAdminEmailTemplatePreview(req, res).catch(next);
    },
  );
  app.patch("/api/admin/registrations/:reference/registrant-info", (req, res, next) => {
    void patchAdminRegistrationRegistrantInfo(req, res).catch(next);
  });

  app.get("/api/admin/approvals", (req, res, next) => {
    void getAdminApprovals(req, res).catch(next);
  });
  app.post("/api/admin/approvals", (req, res, next) => {
    void postAdminApprovals(req, res).catch(next);
  });
  app.get(
    "/api/admin/approvals/:batchId/registrations",
    (req, res, next) => {
      void getAdminApprovalRegistrations(req, res).catch(next);
    },
  );
  app.post(
    "/api/admin/approvals/:batchId/approve",
    (req, res, next) => {
      void postAdminApprovalDecision(req, res).catch(next);
    },
  );

  app.get("/api/admin/bank-transfers", (req, res, next) => {
    void getAdminBankTransfers(req, res).catch(next);
  });
  app.post("/api/admin/bank-transfers/verify", (req, res, next) => {
    void postAdminBankVerify(req, res).catch(next);
  });
  app.post("/api/admin/registrations/confirm", (req, res, next) => {
    void postAdminConfirmRegistration(req, res).catch(next);
  });
  app.post("/api/admin/registrations/update-stage", (req, res, next) => {
    void postAdminUpdateStage(req, res).catch(next);
  });

  app.get("/api/admin/check-in/lookup", (req, res, next) => {
    void getCheckInLookup(req, res).catch(next);
  });
  app.post("/api/admin/check-in/record", (req, res, next) => {
    void postCheckInRecord(req, res).catch(next);
  });

  app.post("/api/registrations/acknowledge", (req, res, next) => {
    void postAcknowledge(req, res).catch(next);
  });
  app.post("/api/registrations/commit-for-payment", (req, res, next) => {
    void postCommitForPayment(req, res).catch(next);
  });
  app.post("/api/registrations/complete", (req, res, next) => {
    void postComplete(req, res).catch(next);
  });
  app.post(
    "/api/registrations/bank-slip",
    upload.single("file"),
    (req, res, next) => {
      void postBankSlip(req, res).catch(next);
    },
  );
  app.get("/api/registrations/thank-you-summary", (req, res, next) => {
    void getRegistrationThankYouSummary(req, res).catch(next);
  });
  app.get("/api/registrations/draft/:id", (req, res, next) => {
    void getRegistrationDraft(req, res).catch(next);
  });

  app.post("/api/internal/notification-queue/process", (req, res, next) => {
    void postNotificationQueueProcess(req, res).catch(next);
  });
  app.post("/api/internal/email-queue/process", (req, res, next) => {
    void postEmailQueueProcess(req, res).catch(next);
  });

  app.get("/api/crm/registrations/export", (req, res, next) => {
    void getCrmRegistrationsExport(req, res).catch(next);
  });
  app.get("/api/crm/registrations", (req, res, next) => {
    void getCrmRegistrationsList(req, res).catch(next);
  });
  app.get("/api/crm/registrations/:reference", (req, res, next) => {
    void getCrmRegistrationDetail(req, res).catch(next);
  });

  app.use("/api/v1/users", requireApiKey, usersRouter);
}
