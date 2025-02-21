
import React from 'react';
import Lottie from 'react-lottie';
import animationData from "@/animations/Jellyfish.yellow.money.json"; 

const PaymentSuccess: React.FC = () => {
    const handleProceedToWorkspace = () => {
        // 這裡可以添加邏輯以導航到工作區
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: '100%' }}>
                <Lottie options={defaultOptions} height={400} width={'100%'} />
            </div>
            <h1 style={{ color: '#6d3666' }}>Payment Success</h1>
            <p style={{ color: '#fec948' }}>Thank you for your subscription! Here are your subscription plan details:</p>
            {/* 在這裡顯示訂閱計劃詳情 */}
            <button onClick={handleProceedToWorkspace} style={{ backgroundColor: '#6d3666', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px' }}>
                前往工作區
            </button>
        </div>
    );
};

export default PaymentSuccess;