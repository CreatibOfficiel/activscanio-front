import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes (no auth required)
const isPublicRoute = createRouteMatcher([
  "/tv/display",
  "/api/webhooks/clerk",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  const { userId } = await auth();

  if (!userId) {
    // Detect redirect loop: if referer is from Clerk, we're looping
    const referer = request.headers.get("referer") || "";
    const isFromClerk =
      referer.includes("clerk.") || referer.includes("accounts.dev");

    if (isFromClerk) {
      // Break the loop: redirect to local sign-in instead of back to Clerk
      const signInUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Normal case: let Clerk handle the redirect
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
