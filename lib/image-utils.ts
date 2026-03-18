import { getPlaiceholder } from "plaiceholder";
import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

export const getBlurDataUrl = cache(async (src: string): Promise<string | undefined> => {
  try {
    // If it's an external URL
    if (src.startsWith('http')) {
      const res = await fetch(src);
      const buffer = Buffer.from(await res.arrayBuffer());
      const { base64 } = await getPlaiceholder(buffer, { size: 10 });
      return base64;
    }
    
    // If it's a local file relative to the public directory
    const filePath = path.join(process.cwd(), "public", src);
    const file = await fs.readFile(filePath);
    const { base64 } = await getPlaiceholder(file, { size: 10 });
    return base64;
  } catch (err) {
    console.error("Error generating blur data url for", src, err);
    return undefined;
  }
});
