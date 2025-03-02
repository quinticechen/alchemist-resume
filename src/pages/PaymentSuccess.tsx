import React, { useEffect, useState } from "react";
import Lottie from "react-lottie";
import animationData from "@/animations/Jellyfish.yellow.money.json";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Define the interface for transaction data
interface Transaction {
  stripe_session_id: string;
  amount: number;
  currency: string;
  status: string;
  tier: string;
  created_at: string;
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const plan = searchParams.get("plan");
  const isAnnual = searchParams.get("is_annual") === "true";

  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "verify-stripe-session",
            {
              body: { sessionId },
            }
          );

          if (error || !data.success) {
            console.error("Payment verification error:", error);
            toast({
              title: "Payment Verification Failed",
              description: "Unable to verify payment. Please contact support.",
              variant: "destructive",
            });
          } else {
            console.log("Payment verified", data);
            setVerificationSuccess(true);

            // Fetch transaction data from the database
            const { data: transactionData, error: transactionError } =
              await supabase
                .from("transactions")
                .select("*")
                .eq("stripe_session_id", sessionId)
                .single();

            if (transactionError) {
              console.error("Error fetching transaction:", transactionError);
              toast({
                title: "Transaction Fetch Failed",
                description: "Unable to fetch transaction details.",
                variant: "destructive",
              });
            } else {
              setTransaction(transactionData);
            }

            toast({
              title: "Payment Verified",
              description: "Your payment has been successfully verified.",
            });
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          toast({
            title: "Payment Verification Error",
            description:
              "An error occurred while verifying your payment. Please try again later.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({
          title: "Missing Session ID",
          description:
            "Session ID is missing. Please try again from the pricing page.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, toast]);

  const handleProceedToWorkspace = () => {
    navigate("/alchemist-workshop");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto text-center bg-gradient-primary py-20 px-4 min-h-[80vh] flex flex-col justify-center">
      <div className="w-full mx-auto flex items-center md:w-2/4 lg:w-1/3 xl:w-1/2">
        <Lottie options={defaultOptions} height={"100%"} width={"100%"} />
      </div>
      {verificationSuccess ? (
        <>
          <h1 className="text-6xl font-bold bg-light text-transparent bg-clip-text mb-6">
            Payment Success
          </h1>
          <p className="text-xl text-light mb-8 max-w-3xl mx-auto">
            Thank you for your subscription to the{" "}
            {plan?.charAt(0).toUpperCase() + plan?.slice(1)}{" "}
            {isAnnual ? "Annual" : "Monthly"} Plan!
          </p>

          {transaction && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white mb-8 max-w-xl mx-auto">
              <h3 className="text-xl font-semibold mb-4">
                Transaction Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="text-light/80">Transaction ID:</div>
                <div>{transaction.stripe_session_id.slice(0, 12)}...</div>
                <div className="text-light/80">Amount:</div>
                <div>
                  {transaction.amount} {transaction.currency.toUpperCase()}
                </div>
                <div className="text-light/80">Status:</div>
                <div className="capitalize">{transaction.status}</div>
                <div className="text-light/80">Plan:</div>
                <div className="capitalize">
                  {transaction.tier}
                  {isAnnual ? " Annual" : " Monthly"}
                </div>
                <div className="text-light/80">Date:</div>
                <div>
                  {transaction.created_at
                    ? formatDate(transaction.created_at)
                    : "N/A"}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleProceedToWorkspace}
            size="lg"
            className="text-primary bg-light hover:bg-neutral-300 mx-auto"
          >
            Go to Workshop
          </Button>
        </>
      ) : (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Payment Verification Failed
          </h1>
          <p className="text-light mb-8">
            We couldn't verify your payment. Please contact our support team for
            assistance.
          </p>
          <Button
            onClick={() => navigate("/pricing")}
            className="text-primary bg-light hover:bg-neutral-300"
          >
            Return to Pricing
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;

// import React, { useEffect, useState } from "react";
// import Lottie from "react-lottie";
// import animationData from "@/animations/Jellyfish.yellow.money.json";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";

// const PaymentSuccess: React.FC = () => {
//   const [searchParams] = useSearchParams();
//   const sessionId = searchParams.get("session_id");
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [isLoading, setIsLoading] = useState(true);
//   const [verificationSuccess, setVerificationSuccess] = useState(false);
//   const [transaction, setTransaction] = useState(null); // 新增 transaction 狀態

//   useEffect(() => {
//     const verifyPayment = async () => {
//       if (sessionId) {
//         try {
//           const { data, error } = await supabase.functions.invoke(
//             "verify-stripe-session",
//             {
//               body: { sessionId },
//             }
//           );

//           if (error || !data.success) {
//             console.error("Payment verification error:", error);
//             toast({
//               title: "Payment Verification Failed",
//               description: "Unable to verify payment. Please contact support.",
//               variant: "destructive",
//             });
//           } else {
//             console.log("Payment verified", data);
//             setVerificationSuccess(true);
//             setTransaction(data.transaction); // 從回應中獲取交易資料
//             toast({
//               title: "Payment Verified",
//               description: "Your payment has been successfully verified.",
//             });
//           }
//         } catch (error) {
//           console.error("Error verifying payment:", error);
//           toast({
//             title: "Payment Verification Error",
//             description:
//               "An error occurred while verifying your payment. Please try again later.",
//             variant: "destructive",
//           });
//         } finally {
//           setIsLoading(false);
//         }
//       } else {
//         toast({
//           title: "Missing Session ID",
//           description:
//             "Session ID is missing. Please try again from the pricing page.",
//           variant: "destructive",
//         });
//         setIsLoading(false);
//       }
//     };

//     verifyPayment();
//   }, [sessionId, toast]);

//   const handleProceedToWorkspace = () => {
//     navigate("/alchemist-workshop");
//   };

//   const defaultOptions = {
//     loop: true,
//     autoplay: true,
//     animationData: animationData,
//     rendererSettings: {
//       preserveAspectRatio: "xMidYMid slice",
//     },
//   };

//   if (isLoading) {
//     return (
//       <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
//     );
//   }

//   return (
//     <div className="mx-auto text-center bg-gradient-primary py-20 px-4">
//       <div className="w-full mx-auto flex items-center md:w-2/4 lg:w-1/3 xl:w-1/2">
//         <Lottie options={defaultOptions} height={"100%"} width={"100%"} />
//       </div>
//       {verificationSuccess ? (
//         <>
//           <h1 className="text-6xl font-bold bg-light text-transparent bg-clip-text mb-6">
//             Payment Success
//           </h1>
//           <p className="text-xl text-light mb-8 max-w-3xl mx-auto">
//             Thank you for your subscription!
//           </p>

//           {transaction && (
//             <div className="text-m text-light mb-4 max-w-3xl mx-auto">
//               <p>Transaction ID: {transaction.stripe_session_id}</p>
//               <p>
//                 Amount: {transaction.amount} {transaction.currency}
//               </p>
//               <p>Status: {transaction.status}</p>
//               {/* 顯示更多交易資訊 */}
//             </div>
//           )}
//           <Button
//             onClick={handleProceedToWorkspace}
//             size="lg"
//             className="text-primary bg-light hover:bg-neutral-300"
//           >
//             Go to Workshop
//           </Button>
//         </>
//       ) : (
//         <h1 className="text-6xl font-bold bg-danger text-transparent bg-clip-text mb-6">
//           Payment Verification Failed
//         </h1>
//       )}
//     </div>
//   );
// };

// export default PaymentSuccess;
