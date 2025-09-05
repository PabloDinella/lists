import { Container } from "@/components/ui/container";
import { SiteLayout } from "@/site/site-layout";

export function TermsOfService() {
  return (
    <SiteLayout>
      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
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
              <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
              <p className="mb-4">
                These Terms of Service ("Terms") govern your use of trylists.app ("Service"), operated by trylists.app ("we," "us," or "our"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
              <p className="mb-4">
                trylists.app is a productivity application that allows users to create, organize, and manage lists, tasks, and productivity workflows. The Service includes web-based applications, mobile applications, and related services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
              
              <h3 className="text-xl font-medium mb-3">Account Creation</h3>
              <p className="mb-4">
                To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
              </p>

              <h3 className="text-xl font-medium mb-3">Account Security</h3>
              <p className="mb-4">
                You are responsible for safeguarding the password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
              </p>

              <h3 className="text-xl font-medium mb-3">Account Termination</h3>
              <p className="mb-4">
                You may terminate your account at any time by contacting us. We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
              <p className="mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Upload, post, or transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service for commercial purposes without our written consent</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Create multiple accounts for the purpose of abuse or circumventing restrictions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">User Content</h2>
              
              <h3 className="text-xl font-medium mb-3">Ownership</h3>
              <p className="mb-4">
                You retain ownership of any content you create, upload, or store using the Service ("User Content"). By using the Service, you grant us a limited, non-exclusive, royalty-free license to use, store, and display your User Content solely for the purpose of providing the Service to you.
              </p>

              <h3 className="text-xl font-medium mb-3">Responsibility</h3>
              <p className="mb-4">
                You are solely responsible for your User Content and the consequences of posting or publishing it. You represent and warrant that your User Content does not violate any third-party rights or applicable laws.
              </p>

              <h3 className="text-xl font-medium mb-3">Removal</h3>
              <p className="mb-4">
                We reserve the right to remove any User Content that violates these Terms or that we find objectionable for any reason, without notice to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by trylists.app and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Privacy</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
              <p className="mb-4">
                We strive to provide a reliable and secure service, but we do not guarantee that the Service will be available at all times or that it will be free from errors or interruptions. We may modify, suspend, or discontinue the Service at any time without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="mb-4">
                To the maximum extent permitted by law, trylists.app shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
              <p className="mb-4">
                In no event shall our total liability to you for all claims exceed the amount paid by you, if any, for accessing the Service during the twelve (12) months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Disclaimer of Warranties</h2>
              <p className="mb-4">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, regarding the Service, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
              <p className="mb-4">
                You agree to defend, indemnify, and hold harmless trylists.app and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which trylists.app operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Dispute Resolution</h2>
              <p className="mb-4">
                Any dispute arising from these Terms or your use of the Service shall be resolved through binding arbitration, except for claims that may be brought in small claims court. The arbitration shall be conducted in accordance with the rules of a recognized arbitration organization.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Severability</h2>
              <p className="mb-4">
                If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall be enforced to the fullest extent possible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Entire Agreement</h2>
              <p className="mb-4">
                These Terms constitute the entire agreement between you and trylists.app regarding the use of the Service, superseding any prior agreements between you and trylists.app relating to your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such modifications constitutes your acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none space-y-2">
                <li>Email: legal@trylists.app</li>
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
