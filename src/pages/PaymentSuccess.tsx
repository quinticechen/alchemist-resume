import React, { useEffect, useState } from "react";
import Lottie from "react-lottie";
import animationData from "@/animations/Jellyfish.yellow.money.json";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [transaction, setTransaction] = useState(null); // 新增 transaction 狀態

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
            setTransaction(data.transaction); // 從回應中獲取交易資料
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
      <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
    );
  }

  return (
    <div
      className="bg-gradient-primary py-20 px-4"
      style={{ textAlign: "center" }}
    >
      <div className="w-full mx-auto flex justify-center items-center md:w-2/4 lg:w-1/3 xl:w-1/2">
        <Lottie options={defaultOptions} height={"100%"} width={"100%"} />
      </div>
      {verificationSuccess ? (
        <>
          <h1 className="text-6xl font-bold bg-light text-transparent bg-clip-text mb-6">
            Payment Success
          </h1>
          <p className="text-xl text-light mb-8 max-w-3xl mx-auto">
            Thank you for your subscription!
          </p>

          {transaction && (
            <div>
              <p>Transaction ID: {transaction.stripe_session_id}</p>
              <p>
                Amount: {transaction.amount} {transaction.currency}
              </p>
              <p>Status: {transaction.status}</p>
              {/* 顯示更多交易資訊 */}
            </div>
          )}
          <Button
            onClick={handleProceedToWorkspace}
            size="lg"
            className="text-primary bg-light hover:bg-neutral-300"
          >
            Go to Workshop
          </Button>
        </>
      ) : (
        <h1 className="text-6xl font-bold bg-danger text-transparent bg-clip-text mb-6">
          Payment Verification Failed
        </h1>
      )}
    </div>
  );
};

export default PaymentSuccess;

// ---

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
//           // 1. 驗證付款
//           const { data, error } = await supabase.functions.invoke(
//             "verify-stripe-session",
//             {
//               body: { sessionId },
//             }
//           );

//           if (error) {
//             console.error("Payment verification error:", error);
//             toast({
//               title: "Payment Verification Failed",
//               description: "Unable to verify payment. Please contact support.",
//               variant: "destructive",
//             });
//             setIsLoading(false);
//             return;
//           }

//           if (data && data.success) {
//             console.log("Payment verified", data);
//             setVerificationSuccess(true);
//             toast({
//               title: "Payment Verified",
//               description: "Your payment has been successfully verified.",
//             });

//             // 2. 查詢交易記錄
//             const { data: transactionData, error: transactionError } =
//               await supabase
//                 .from("transactions")
//                 .select("*")
//                 .eq("stripe_session_id", sessionId)
//                 .single();

//             if (transactionError) {
//               console.error("Error fetching transaction:", transactionError);
//               toast({
//                 title: "Transaction Fetch Failed",
//                 description: "Unable to fetch transaction details.",
//                 variant: "destructive",
//               });
//             } else {
//               setTransaction(transactionData);
//             }
//           } else {
//             console.error(
//               "Payment verification failed: Invalid response",
//               data
//             );
//             toast({
//               title: "Payment Verification Failed",
//               description: "Unable to verify payment. Please contact support.",
//               variant: "destructive",
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
//     <div className="bg-gradient-primary py-20 px-4">
//       <div className="w-full mx-auto flex justify-center items-center md:w-2/4 lg:w-1/3 xl:w-1/2">
//         <Lottie options={defaultOptions} height={"100%"} width={"100%"} />
//       </div>
//       <div>
//         {verificationSuccess ? (
//           <>
//             <h1 className="text-6xl font-bold bg-light text-transparent bg-clip-text mb-6">
//               Payment Success
//             </h1>
//             <p className="text-xl text-light mb-8 max-w-3xl mx-auto">
//               Thank you for your subscription!
//             </p>

//             {transaction && (
//               <div>
//                 <p>Transaction ID: {transaction.id}</p>
//                 <p>
//                   Amount: {transaction.amount} {transaction.currency}
//                 </p>
//                 <p>Status: {transaction.status}</p>
//                 {/* 顯示更多交易資訊 */}
//               </div>
//             )}
//             <Button
//               onClick={handleProceedToWorkspace}
//               size="lg"
//               className="text-primary bg-light hover:bg-neutral-300"
//             >
//               前往工作區
//             </Button>
//           </>
//         ) : (
//           <h1 className="text-6xl font-bold bg-danger text-transparent bg-clip-text mb-6">
//             Payment Verification Failed
//           </h1>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PaymentSuccess;
