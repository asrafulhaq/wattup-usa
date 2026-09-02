import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// No `migrations` block, deliberately. wattup-frontend owns the schema and is the
// only app that migrates it. See ADR 0001 section 5.
export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env['DATABASE_URL'],
    },
});
