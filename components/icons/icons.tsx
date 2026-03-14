import * as React from 'react';

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={11}
            height={18}
            viewBox='0 0 11 18'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M9.414 1l-8 8 8 8'
                stroke='#2D2D2D'
                strokeWidth={2}
                strokeLinecap='round'
            />
        </svg>
    );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={11}
            height={18}
            viewBox='0 0 11 18'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M1 1l8 8-8 8'
                stroke='#2D2D2D'
                strokeWidth={2}
                strokeLinecap='round'
            />
        </svg>
    );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={20}
            height={20}
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M5.8 0h8.4C17.4 0 20 2.6 20 5.8v8.4a5.8 5.8 0 01-5.8 5.8H5.8C2.6 20 0 17.4 0 14.2V5.8A5.8 5.8 0 015.8 0zm-.2 2A3.6 3.6 0 002 5.6v8.8C2 16.39 3.61 18 5.6 18h8.8a3.6 3.6 0 003.6-3.6V5.6C18 3.61 16.39 2 14.4 2H5.6zm9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM10 5a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z'
                fill='#fff'
                fillOpacity={0.5}
            />
        </svg>
    );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={20}
            height={20}
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M20 10c0-5.52-4.48-10-10-10S0 4.48 0 10c0 4.84 3.44 8.87 8 9.8V13H6v-3h2V7.5C8 5.57 9.57 4 11.5 4H14v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z'
                fill='#fff'
                fillOpacity={0.5}
            />
        </svg>
    );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={24}
            height={22}
            viewBox='0 0 24 22'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M18.9 0h3.68l-8.04 9.213L24 21.75h-7.406l-5.804-7.603-6.635 7.603H.471l8.6-9.857L0 .002h7.594l5.24 6.948L18.9 0zm-1.294 19.543h2.04L6.48 2.093H4.293l13.313 17.45z'
                fill='#fff'
                fillOpacity={0.5}
            />
        </svg>
    );
}

export { ArrowLeftIcon, ArrowRightIcon, FacebookIcon, InstagramIcon, XIcon };

