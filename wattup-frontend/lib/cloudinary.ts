import 'server-only';

import { v2 as cloudinary } from 'cloudinary';

// Server-side only. This config carries the API secret and signs every upload
// (lib/image-service.ts, reached from the image and user server actions), so
// none of its variables is NEXT_PUBLIC_ and none may become so: a NEXT_PUBLIC_
// fallback here would put the API key in the client bundle for no reason and
// invite a client-side upload path that would be genuinely unsafe (finding
// F12). The 'server-only' import makes a client import a build error rather
// than a leak. The browser's delivery URLs use the public cloud name from
// lib/images/, which is a separate, deliberately public variable.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export default cloudinary;
