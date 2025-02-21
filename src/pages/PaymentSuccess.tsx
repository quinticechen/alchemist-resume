import React, { useEffect, useState } from 'react';
import Lottie from 'react-lottie';
import animationData from "@/animations/Jellyfish.yellow.money.json"; 
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [verificationSuccess, setVerificationSuccess] = useState(false);

    useEffect(() => {
        const verifyPayment = async () => {
            if (sessionId) {
                try {
                    const { data, error } = await supabase.functions.invoke('verify-stripe-session', {
                        body: { sessionId },
                    });

                    if (error) {
                        console.error('Payment verification error:', error);
                        toast({
                            title: "Payment Verification Failed",
                            description: "Unable to verify payment. Please contact support.",
                            variant: "destructive",
                        });
                        setIsLoading(false);
                        return;
                    }

                    if (data && data.success) {
                        console.log("Payment verified", data);
                        setVerificationSuccess(true);
                        toast({
                            title: "Payment Verified",
                            description: "Your payment has been successfully verified.",
                        });
                    } else {
                        console.error('Payment verification failed: Invalid response', data);
                        toast({
                            title: "Payment Verification Failed",
                            description: "Unable to verify payment. Please contact support.",
                            variant: "destructive",
                        });
                    }
                } catch (error) {
                    console.error('Error verifying payment:', error);
                    toast({
                        title: "Payment Verification Error",
                        description: "An error occurred while verifying your payment. Please try again later.",
                        variant: "destructive",
                    });
                } finally {
                    setIsLoading(false);
                }
            } else {
                toast({
                    title: "Missing Session ID",
                    description: "Session ID is missing. Please try again from the pricing page.",
                    variant: "destructive",
                });
                setIsLoading(false);
            }
        };

        verifyPayment();
    }, [sessionId, toast]);

    const handleProceedToWorkspace = () => {
        navigate('/alchemist-workshop'); // 導航到工作區
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
        return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
    }

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: '100%' }}>
                <Lottie options={defaultOptions} height={400} width={'100%'} />
            </div>
            {verificationSuccess ? (
                <>
                    <h1 style={{ color: '#6d3666' }}>Payment Success</h1>
                    <p style={{ color: '#fec948' }}>Thank you for your subscription!</p>
                    <Button onClick={handleProceedToWorkspace} style={{ backgroundColor: '#6d3666', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px' }}>
                        前往工作區
                    </Button>
                </>
            ) : (
                <h1 style={{ color: 'red' }}>Payment Verification Failed</h1>
            )}
        </div>
    );
};

export default PaymentSuccess;