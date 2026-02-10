"use client";

import React from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

export default function AdScript() {
  const [enabled, setEnabled] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMounted(true);

    const checkAds = () => {
      const saved = localStorage.getItem("ads_enabled");
      setEnabled(saved !== "false");
    };

    checkAds();
    window.addEventListener("ads_toggle", checkAds);
    return () => window.removeEventListener("ads_toggle", checkAds);
  }, []);

  if (!mounted || !enabled) return null;

  return (
    <>
      {/* POPS Script */}
      <Script
        key={`ads-pops-${pathname}`}
        id="ads-pops"
        strategy="afterInteractive"
        data-cfasync="false"
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  var m=window,
      g="ea74bf72470ff7c33057ce17f4e0f1b8",
      v=[
        ["siteId",294+749-238+305+614+5272653],
        ["minBid",0],
        ["popundersPerIP","0"],
        ["delayBetween",0],
        ["default",false],
        ["defaultPerDay",0],
        ["topmostLayer","auto"]
      ],
      y=[
        "d3d3LnZpc2FyaW9tZWRpYS5jb20vYmpxdWVyeS5zaWduYWxSLm1pbi5jc3M=",
        "ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvV2xMZXcvb2JpZ1NsaWRlLm1pbi5qcw=="
      ],
      j=-1,n,x,
      k=function(){
        clearTimeout(x);
        j++;
        if(y[j] && !(1796346955000 < (new Date).getTime() && 1 < j)){
          n=m.document.createElement("script");
          n.type="text/javascript";
          n.async=true;
          var i=m.document.getElementsByTagName("script")[0];
          n.src="https://"+atob(y[j]);
          n.crossOrigin="anonymous";
          n.onerror=k;
          n.onload=function(){
            clearTimeout(x);
            m[g.slice(0,16)+g.slice(0,16)]||k()
          };
          x=setTimeout(k,5000);
          i.parentNode.insertBefore(n,i)
        }
      };
  if(!m[g]){
    try{Object.freeze(m[g]=v)}catch(e){}
    k()
  }
})();
          `,
        }}
      />
    </>
  );
}
