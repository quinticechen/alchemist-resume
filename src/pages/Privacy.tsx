const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Privacy Policy
          </h1>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personal information (name, email) through Google and LinkedIn OAuth authentication</li>
              <li>Resume content and job application data</li>
              <li>Usage data and subscription status</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide resume customization and job matching services</li>
              <li>To track free usage quota and manage subscriptions</li>
              <li>To improve our services and user experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Data Storage and Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All resumes and personal data are encrypted and securely stored</li>
              <li>We implement industry-standard security measures to protect your information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not sell your personal information to third parties</li>
              <li>Data may be shared with service providers (including Google and LinkedIn) only as necessary to provide our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. User Rights</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to access your personal data</li>
              <li>Right to request deletion of your data</li>
              <li>Right to opt-out of certain data processing activities</li>
              <li>Right to manage OAuth connections with Google and LinkedIn</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We use cookies to track usage and maintain login sessions</li>
              <li>Users can control cookie preferences through browser settings</li>
              <li>OAuth-related cookies from Google and LinkedIn may be used for authentication</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Changes to Privacy Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We reserve the right to update this policy</li>
              <li>Users will be notified of significant changes</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
