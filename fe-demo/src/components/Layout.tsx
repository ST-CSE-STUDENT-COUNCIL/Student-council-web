import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">

                <div className="flex flex-col flex-1 overflow-y-auto relative">
                    <main className="flex-1 p-6">
                        {children}
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default Layout;
