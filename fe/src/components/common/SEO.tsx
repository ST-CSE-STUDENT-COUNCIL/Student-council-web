import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
}

export function SEO({
    title,
    description = "서울과학기술대학교 컴퓨터공학과 학생회 웹사이트입니다.",
    keywords = "서울과학기술대학교, 컴퓨터공학과, 학생회, SeoulTech, CSE, Computer Science, Student Council",
    image = "/logo.jpg",
    url
}: SEOProps) {
    const siteUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const currentUrl = url ? `${siteUrl}${url}` : window.location.href;
    const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

    return (
        <Helmet>
            {/* Basic */}
            <title>{title} | 서울과학기술대학교 컴퓨터공학과 학생회</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph / Facebook / Kakao */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImageUrl} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:site_name" content="서울과학기술대학교 컴퓨터공학과 학생회" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImageUrl} />
        </Helmet>
    );
}
