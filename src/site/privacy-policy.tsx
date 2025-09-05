import { Container } from "@/components/ui/container";
import { SiteLayout } from "@/site/site-layout";

export function PrivacyPolicy() {
  return (
    <SiteLayout>
      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="mb-4">
                Welcome to trylists.app ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our productivity application.
              </p>
              <p>
                By using trylists.app, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-3">Personal Information</h3>
              <p className="mb-4">We may collect the following personal information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Email address (for account creation and authentication)</li>
                <li>Name or display name (optional)</li>
                <li>Profile information you choose to provide</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Usage Data</h3>
              <p className="mb-4">We automatically collect certain information about your use of the application:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Your lists, tasks, and productivity data</li>
                <li>Application usage patterns and preferences</li>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and general location information</li>
                <li>Error logs and performance data</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Cookies and Tracking</h3>
              <p className="mb-4">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized features. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p className="mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide and maintain the trylists.app service</li>
                <li>Process your account registration and authentication</li>
                <li>Store and sync your lists, tasks, and productivity data</li>
                <li>Improve our application and user experience</li>
                <li>Send important service updates and notifications</li>
                <li>Respond to your support requests and inquiries</li>
                <li>Analyze usage patterns to enhance features</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Storage and Security</h2>
              
              <h3 className="text-xl font-medium mb-3">Data Storage</h3>
              <p className="mb-4">
                Your data is stored securely using Supabase, a trusted cloud database provider. We implement industry-standard security measures to protect your information.
              </p>

              <h3 className="text-xl font-medium mb-3">Data Security</h3>
              <p className="mb-4">We employ various security measures to protect your data:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and authorization</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
                <li>Backup and disaster recovery procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
              <p className="mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>With trusted service providers who assist in operating our service (under strict confidentiality agreements)</li>
                <li>In connection with a business transfer or merger (with notice to users)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
              <p className="mb-4">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a standard format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
                <li><strong>Object:</strong> Object to certain processing activities</li>
              </ul>
              <p>
                To exercise these rights, please contact us at the email address provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal, regulatory, or legitimate business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="mb-4">
                trylists.app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none space-y-2">
                <li>Email: support@trylists.app</li>
                <li>GitHub: <a href="https://github.com/pablodinella/lists/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://github.com/pablodinella/lists/</a></li>
                <li>Feedback & Support: <a href="https://trylistsapp.featurebase.app/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://trylistsapp.featurebase.app/</a></li>
              </ul>
            </section>
          </div>
        </div>
      </Container>
    </SiteLayout>
  );
}
