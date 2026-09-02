import { NextResponse } from "next/server";
import { uploadSingleImage } from "@/app/_actions/image-actions";
import { isAllowedFolder, MAX_UPLOAD_BYTES } from "@/lib/image-service";
import { requirePermission } from "@/lib/permission-guard";
import { Permission } from "@/lib/permissions";

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
  // UPLOAD_MEDIA, resolved for this request (checklist 4a.16). The action below checks
  // it again; the check here is what keeps an unauthorised body from being read at all.
  const authorised = await requirePermission(Permission.UPLOAD_MEDIA);
  if (!authorised) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Refused before the body is buffered (backlog B.9). A missing Content-Length is
  // refused too: a browser always sends it for a multipart POST, and a client that
  // withholds it is not one this route serves. The action re-checks the file's own
  // size, so a lying header buys nothing.
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0 || declared > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Upload is larger than 10 MB" }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "tiptap";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // The allowlist lives with the image service so the server actions enforce the same one.
    if (!isAllowedFolder(folder)) {
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
