import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { notebooks } from "./db/schema";
import { resend } from "./resend";

// The Docker runner image always sets NODE_ENV=production (required for
// Next.js's production server), so this can't key off NODE_ENV alone -
// SKIP_EMAIL_VERIFICATION lets the dev docker-compose setup opt in too.
const skipEmailVerification =
  process.env.NODE_ENV !== "production" || process.env.SKIP_EMAIL_VERIFICATION === "true";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // Skipped in dev so sign-up signs the user straight in instead of
    // requiring a click-through on an email we don't actually send there.
    requireEmailVerification: !skipEmailVerification,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (skipEmailVerification) {
        console.log(`[dev] Skipping verification email; verify ${user.email} at: ${url}`);
        return;
      }

      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: "Verify your email for Catat",
        html: `<p>Click the link below to verify your email and finish setting up your Catat account.</p><p><a href="${url}">Verify email</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      });
      if (error) {
        console.error("Failed to send verification email:", error);
        throw new Error(`Failed to send verification email: ${error.message}`);
      }
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(notebooks).values({
            id: crypto.randomUUID(),
            userId: user.id,
            name: "General",
          });
        },
      },
    },
  },
  // Add OAuth providers later by populating this object, e.g.:
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  // },
});
