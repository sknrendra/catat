import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { notebooks } from "./db/schema";
import { resend } from "./resend";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: "Verify your email for Catat",
        html: `<p>Click the link below to verify your email and finish setting up your Catat account.</p><p><a href="${url}">Verify email</a></p><p>If you didn't request this, you can ignore this email.</p>`,
      });
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
