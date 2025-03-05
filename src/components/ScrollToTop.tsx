import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); // 滾動到頁面頂部
  }, [pathname]); // 當路由變更時觸發

  return null; // 此組件不需要渲染任何內容
};

export default ScrollToTop;