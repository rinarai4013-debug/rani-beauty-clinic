import Script from "next/script";
import { clinicInfo } from "@/data/clinic-info";

export default function Analytics() {
  const { ga4, gtm, metaPixel, clarity } = clinicInfo.analytics;

  return (
    <>
      {/* Google Tag Manager */}
      {gtm && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`,
          }}
        />
      )}

      {/* GA4 (direct, if no GTM) */}
      {ga4 && !gtm && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`,
            }}
          />
        </>
      )}

      {/* Microsoft Clarity */}
      {clarity && (
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${clarity}");`,
          }}
        />
      )}

      {/* Mangomint Online Booking Overlay */}
      <Script
        id="mangomint-booking"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.Mangomint = window.Mangomint || {};
window.Mangomint.CompanyId = ${clinicInfo.booking.companyId};`,
        }}
      />
      <Script
        id="mangomint-booking-sdk"
        src="https://booking.mangomint.com/app.js"
        strategy="afterInteractive"
      />

      {/* Meta Pixel */}
      {metaPixel && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixel}');
fbq('track','PageView');`,
          }}
        />
      )}
    </>
  );
}

export function GTMNoScript() {
  const { gtm } = clinicInfo.analytics;
  if (!gtm) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
