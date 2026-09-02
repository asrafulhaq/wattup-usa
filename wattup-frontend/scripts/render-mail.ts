/**
 * Renders every email template to an .html file so it can be opened in a browser
 * with the OS in light and then in dark mode, and runs the dark-mode coverage check
 * (scripts/mail-dark-coverage.ts) over each one. Sends nothing: the templates are
 * pure functions and lib/email.ts is never imported.
 *
 *   pnpm exec tsx scripts/render-mail.ts [outDir]
 *
 * outDir defaults to <os tmpdir>/wattup-mail-preview. Exit code 1 if any check fails.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { driverInquiryConfirmation, driverInquiryNotification, hostInquiryNotification } from '../lib/mail/contact';
import { inviteUserTemplate } from '../lib/mail/invite-user';
import { resetPasswordTemplate } from '../lib/mail/reset-password';
import { checkDarkCoverage, formatCoverage } from './mail-dark-coverage';

const outDir = resolve(process.argv[2] ?? join(tmpdir(), 'wattup-mail-preview'));
mkdirSync(outDir, { recursive: true });

const rendered: Record<string, { subject: string; html: string }> = {
    'invite-user': inviteUserTemplate({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'Tmp-9f3kQ2',
        role: 'Editor',
        invitedBy: 'Grace Hopper',
    }),
    'reset-password': resetPasswordTemplate({
        name: 'Ada',
        url: 'https://wattupusa.com/reset-password?token=example',
    }),
    'contact-driver-notification': driverInquiryNotification({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'The charger at Bay 4 stopped at 60%.\nCan someone take a look?',
    }),
    'contact-host-notification': hostInquiryNotification({
        companyName: 'Example Plaza LLC',
        location: 'Sacramento, CA',
        parkingSpaces: '120',
        contactInfo: 'Grace Hopper\ngrace@example.com',
    }),
    'contact-driver-confirmation': driverInquiryConfirmation({ name: 'Ada' }),
};

let failed = false;
for (const [name, { html }] of Object.entries(rendered)) {
    const file = join(outDir, `${name}.html`);
    writeFileSync(file, html);
    const coverage = checkDarkCoverage(html);
    if (coverage.problems.length > 0) failed = true;
    console.log(file);
    console.log(formatCoverage(name, coverage));
}

if (failed) process.exitCode = 1;
