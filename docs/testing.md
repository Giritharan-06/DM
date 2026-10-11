# Testing

Unit/API tests cover enquiry validation, consent/honeypot, bad origins, honest failure without persistence, money calculations and the permission matrix. Database integration tests require a distinct `TEST_DATABASE_URL`; they migrate the test database and test uniqueness, persistence, rollback and concurrent numbering. Browser tests cover desktop/mobile public navigation, validation, reduced motion and sign-in layout.

## Live acceptance checklist

Provision owner, sales, marketing and finance accounts in an isolated Neon branch. Submit a unique enquiry; retry and check one lead, one creation activity and notification. Assign sales; move stages and refresh. Mark Won and convert twice; verify one client/contact. As another salesperson, verify 404 on the lead. As sales, verify 403 on invoices/payments. Signed-out requests must not return private data.

Create an assigned task, comment and complete it; verify one next recurring task. Create an invoice with discount/tax; compare its PDF with stored values. Record a partial payment, retry its reference, reject an overpayment and complete the balance. Verify numbering under concurrent requests.

Test R2 with authorized/unassigned accounts and expired signed URLs. Test Turnstile valid/expired/invalid tokens on the actual hostname. Test Resend retries and provider acceptance separately from delivery. Verify expired sessions and production cookie behavior.

Check 390px/768px layouts, modal focus trapping, keyboard use, validation announcements, long names, scrollable tables and pipeline selectors. Test reduced motion throughout. Run Lighthouse on the deployed website; no score is claimed without measurement.
