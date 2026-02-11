import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article';
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    noindex?: boolean;
}

export function SEO({
    title,
    description = "서울과학기술대학교 컴퓨터공학과 학생회 웹사이트입니다. 학생회 공지사항, 행사 신청 및 일정, 정보공개, 복지사업(물품 대여, 사물함, 프린터, 신입생 가이드북 등), 동아리, 건의함 등 다양한 서비스를 이용할 수 있습니다.",
    keywords = "서울과학기술대학교, 컴퓨터공학과, 학생회, SeoulTech, CSE, Computer Science, Student Council, 서울과기대, 공지사항, 행사신청, 복지사업, 동아리, 설곽, 과기대, 컴공",
    image = "/logo.jpg",
    url,
    type = 'website',
    author = '서울과학기술대학교 컴퓨터공학과 학생회',
    publishedTime,
    modifiedTime,
    noindex = false
}: SEOProps) {
    const siteUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const currentUrl = url ? `${siteUrl}${url}` : window.location.href;
    const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
    const siteName = '서울과학기술대학교 컴퓨터공학과 학생회';
    const fullTitle = `${title} | ${siteName}`;

    // 구조화된 데이터 (JSON-LD)
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": siteName,
        "url": siteUrl,
        "logo": fullImageUrl,
        "description": description,
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "KR",
            "addressRegion": "서울",
            "addressLocality": "노원구"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "학생회",
            "availableLanguage": "ko"
        }
    };

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <html lang="ko" />
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <meta name="author" content={author} />
            <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"} />
            <meta name="googlebot" content={noindex ? "noindex,nofollow" : "index,follow"} />

            {/* Canonical URL */}
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook / Kakao */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImageUrl} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content="ko_KR" />
            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
            {author && <meta property="article:author" content={author} />}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImageUrl} />

            {/* Additional SEO Tags */}
            <meta name="theme-color" content="#4F46E5" />
            <meta name="apple-mobile-web-app-title" content={siteName} />
            <meta name="application-name" content={siteName} />
            <meta name="format-detection" content="telephone=no" />

            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>
        </Helmet>
    );
}
