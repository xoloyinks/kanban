import React, { useEffect, useRef, useState } from 'react'

export default function AnimCounter({ value, duration = 1100 }: { value: number | undefined; duration?: number }) {
  const [n, setN] = useState(0);
      const prev = useRef(0);
      useEffect(() => {
          const start = prev.current, end = value || 0;
          const step = (end - start) / (duration / 16);
          let cur = start;
          const t = setInterval(() => {
              cur += step;
              if ((step >= 0 && cur >= end) || (step < 0 && cur <= end)) { setN(end); clearInterval(t); }
              else setN(Math.round(cur));
          }, 16);
          prev.current = end;
          return () => clearInterval(t);
      }, [value, duration]);
      return <>{n}</>;
}
