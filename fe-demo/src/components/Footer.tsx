import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()}컴퓨터공학과 학생회. All rights reserved.
        </footer>
    );
};

export default Footer;
