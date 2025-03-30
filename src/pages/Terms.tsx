const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Terms of Service
          </h1>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Service Description</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-powered resume customization and job matching service</li>
              <li>Limited to 3 free uses for new users, followed by paid subscription</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authentication through Google or LinkedIn OAuth required</li>
              <li>Users must provide accurate information through their chosen OAuth provider</li>
              <li>Account sharing is prohibited</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Content</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users retain ownership of uploaded resumes</li>
              <li>Users grant us license to process and analyze uploaded content</li>
              <li>Users are responsible for the accuracy of submitted information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Usage Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Free tier limited to 3 uses per account</li>
              <li>Subscription required for continued use</li>
              <li>Prohibited from circumventing usage limitations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Service Limitations</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>No guarantee of employment outcomes</li>
              <li>Service provided "as is"</li>
              <li>We reserve the right to modify or terminate service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All service-generated content remains our property</li>
              <li>Users receive limited license to use generated resumes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We reserve the right to terminate accounts for violations</li>
              <li>Users may terminate their account at any time</li>
              <li>Account termination may be subject to LinkedIn or Google OAuth policies</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
