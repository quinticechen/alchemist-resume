
import React from 'react';

const PaymentSuccess: React.FC = () => {
    const handleProceedToWorkspace = () => {
        // 這裡可以添加邏輯以導航到工作區
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <video width="100%" controls autoPlay loop>
                <source src="https://vhofgqmmovjtcnakowlv.supabase.co/storage/v1/object/sign/elements/Jellyfish-Yellow-Money.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJlbGVtZW50cy9KZWxseWZpc2gtWWVsbG93LU1vbmV5Lm1wNCIsImlhdCI6MTc0MDA0NjY2NSwiZXhwIjozMzI0NDUxMDY2NX0.cdnvOQEZc6gF2DLwfLXcN393IPYCuyAG7IUVW1z1jd0" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
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