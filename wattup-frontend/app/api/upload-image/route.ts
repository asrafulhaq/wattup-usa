import { NextResponse } from "next/server";
import { getSession } from "@/app/_actions/auth-actions";
import { uploadSingleImage } from "@/app/_actions/image-actions";

// The only Cloudinary folders an upload may land in. Each is a folder a caller in this app
// already uses: "tiptap" from lib/tiptap-utils.ts, "articles" from the article form,
// "locations" from the location form, "profile-photos" from userActions.ts, and "drafts",
// the image-service default. Anything else was a stranger choosing where to file uploads.
const ALLOWED_FOLDERS = new Set([
  "tiptap",
  "articles",
  "locations",
  "profile-photos",
  "drafts",
]);

/**
 * True when the request came from one of this site's own pages.
 *
 * A browser sets Origin on every cross-site POST and a page cannot forge it, so a mismatch
 * is a foreign site riding on a signed-in user's cookie. Referer covers the few clients
 * that omit Origin. x-forwarded-host is the host the browser addressed when a proxy sits
 * in front of Next, which is what the Origin will name.
 */
function isSameOrigin(request: Request): boolean {
  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (!source) return false;

  let sourceHost: string;
  try {
    sourceHost = new URL(source).host;
  } catch {
    return false;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return host !== null && sourceHost === host;
}

export async function POST(request: Request) {
  // Any signed-in user for now; the UPLOAD_MEDIA permission tightens this in phase 4a.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "tiptap";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof folder !== "string" || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const result = await uploadSingleImage(file, { folder });

    if (!result.success) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({ url: result.data?.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
