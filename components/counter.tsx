// import { useScrollReveal } from '@/hooks/useScrollReveal';
import React, { useEffect, useState } from 'react'

export default function Counter({ end, suffix = "" }: { end: number; suffix?: string; }) {
   const [count, setCount] = useState(0);
    // const { ref, inView } = useScrollReveal(0.5);
  
    useEffect(() => {
    //   if (!inView) return;
      let start = 0;
      const duration = 1800;
      const step = (end / duration) * 16;
      const timer = setInterval(() => {
        start += step;
        if (start >= end) { setCount(end); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
      return () => clearInterval(timer);
    }, [end]);
  
    return <span>{count.toLocaleString()}{suffix}</span>;
}
