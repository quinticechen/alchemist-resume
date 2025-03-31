
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import JellyfishDialog from "@/components/JellyfishDialog";

const FAQ = () => {
  const faqs = [
    {
      question: "What is ResumeAlchemist?",
      answer:
        "ResumeAlchemist is an AI-powered platform that helps you customize your resume to match specific job descriptions, increasing your chances of getting noticed by recruiters.",
    },
    {
      question: "How many free uses do I get?",
      answer:
        "New users receive 3 free resume customizations. After that, you'll need to subscribe to one of our paid plans to continue using the service.",
    },
    {
      question: "What file formats are supported?",
      answer:
        "Currently, we support PDF format for resume uploads. We recommend using clean, simple formatting for best results.",
    },
    {
      question: "How does the matching process work?",
      answer:
        "Our AI analyzes both your resume and the job description, identifying key requirements and skills. It then helps optimize your resume to better align with the job requirements while maintaining authenticity.",
    },
    {
      question: "How long does the process take?",
      answer:
        "The optimization process typically takes 2-3 minutes, depending on the length of your resume and the complexity of the job description.",
    },
  ];

  return (
    <div className="relative">
      <JellyfishDialog position="middle" simpleTipMode={true} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Frequently Asked Questions
          </h1>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-lg shadow-apple"
              >
                <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-neutral-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
