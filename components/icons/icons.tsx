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
            xmlns='http://www.w3.org/2000/svg'
            width={26}
            height={26}
            viewBox='0 0 24 24'
            fill='none'
            {...props}>
            <path
                d='M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2zm-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z'
                fill='#fff'
                fillOpacity={0.5}
            />
        </svg>
    );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width={24}
            height={24}
            viewBox='0 0 20 20'
            fill='none'
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
            xmlns='http://www.w3.org/2000/svg'
            width={24}
            height={24}
            viewBox='0 0 24 24'
            fill='none'
            {...props}>
            <g clipPath='url(#clip0_811_2420)'>
                <mask
                    id='a'
                    style={{
                        maskType: 'luminance',
                    }}
                    maskUnits='userSpaceOnUse'
                    x={0}
                    y={0}
                    width={24}
                    height={24}>
                    <path d='M0 0h24v24H0V0z' fill='#fff' />
                </mask>
                <g mask='url(#a)'>
                    <path
                        d='M18.9 1.124h3.68l-8.04 9.213L24 22.875h-7.406l-5.804-7.603-6.635 7.603H.471l8.6-9.857L0 1.126h7.594l5.24 6.948 6.066-6.95zm-1.294 19.543h2.04L6.48 3.217H4.293l13.313 17.45z'
                        fill='#fff'
                        fillOpacity={0.5}
                    />
                </g>
            </g>
            <defs>
                <clipPath id='clip0_811_2420'>
                    <path fill='#fff' d='M0 0H24V24H0z' />
                </clipPath>
            </defs>
        </svg>
    );
}
function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width={24}
            height={24}
            viewBox='0 0 24 24'
            fill='none'
            {...props}>
            <path
                d='M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2V9zm2-6a2 2 0 110 4 2 2 0 010-4z'
                fill='#fff'
                fillOpacity={0.5}
            />
        </svg>
    );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={17}
            height={17}
            viewBox='0 0 17 17'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M15.234 16.366a.8.8 0 101.132-1.132l-.566.566-.566.566zm-2.493-4.757a.8.8 0 10-1.132 1.132l.566-.566.566-.566zm1.392-4.142h-.8a5.867 5.867 0 01-5.867 5.866v1.6a7.467 7.467 0 007.467-7.466h-.8zm-6.667 6.666v-.8A5.867 5.867 0 011.6 7.467H0a7.467 7.467 0 007.466 7.466v-.8zM.8 7.467h.8A5.867 5.867 0 017.466 1.6V0A7.467 7.467 0 000 7.467h.8zM7.466.8v.8a5.867 5.867 0 015.867 5.867h1.6A7.467 7.467 0 007.466 0v.8zm8.334 15l.566-.566-3.625-3.625-.566.566-.566.566 3.625 3.625.566-.566z'
                fill='#2D2D2D'
                fillOpacity={0.7}
            />
        </svg>
    );
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={12}
            height={12}
            viewBox='0 0 12 12'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M.8.8l10 10m0-10l-10 10'
                stroke='#2D2D2D'
                strokeOpacity={0.7}
                strokeWidth={1.6}
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}
function CarretUpIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={14}
            height={8}
            viewBox='0 0 14 8'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M13 7L7 1 1 7'
                stroke='#2D2D2D'
                strokeOpacity={0.5}
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}
function CarretDownIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={14}
            height={8}
            viewBox='0 0 14 8'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M13 1L7 7 1 1'
                stroke='#2D2D2D'
                strokeOpacity={0.5}
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}

function EllipsisIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={11}
            height={11}
            viewBox='0 0 11 11'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <circle cx={5.1476} cy={5.1476} r={5.1476} fill='#fff' />
        </svg>
    );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={16}
            height={16}
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M1 8h14m-7 7V1'
                stroke='#fff'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}
function CancelIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={12}
            height={12}
            viewBox='0 0 12 12'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M1 10.9L10.899 1m0 9.9L.999 1'
                stroke='#fff'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}
function CheckboxIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={16}
            height={16}
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <rect x={0.5} y={0.5} width={15} height={15} rx={3.5} fill='#fff' />
            <rect
                x={0.5}
                y={0.5}
                width={15}
                height={15}
                rx={3.5}
                stroke='#2D2D2D'
            />
        </svg>
    );
}
function MobileMenuIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={43}
            height={43}
            viewBox='0 0 43 43'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            style={{ display: 'block' }}
            {...props}>
            <rect width={43} height={43} rx={21.5} fill='#fff' />
            <path
                d='M30.824 18.387H10.977c-.452 0-.827-.47-.827-1.037s.375-1.038.827-1.038h19.847c.452 0 .826.47.826 1.038 0 .567-.374 1.037-.826 1.037zM30.824 26.688H10.977c-.452 0-.827-.47-.827-1.038 0-.567.375-1.038.827-1.038h19.847c.452 0 .826.47.826 1.038 0 .567-.374 1.038-.826 1.038z'
                fill='#2D2D2D'
            />
        </svg>
    );
}
function MobileMenuCloseIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={43}
            height={43}
            viewBox='0 0 43 43'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            style={{ display: 'block' }}
            {...props}>
            <rect width={43} height={43} rx={21.5} fill='#fff' />
            <path
                d='M14 15.05l12 12M14 27.05l12-12'
                stroke='#2D2D2D'
                strokeWidth={2.12125}
                strokeLinecap='square'
                strokeLinejoin='round'
            />
        </svg>
    );
}
function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={20}
            height={20}
            viewBox='0 0 20 20'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            {...props}>
            <path
                d='M17.5 6.667h-10m0 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm5 6.666h-10m10 0a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0z'
                stroke='#2D2D2D'
                strokeOpacity={0.7}
                strokeWidth={1.6}
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}
export {
    ArrowLeftIcon,
    ArrowRightIcon,
    CancelIcon,
    CarretDownIcon,
    CarretUpIcon,
    CheckboxIcon,
    CloseIcon,
    EllipsisIcon,
    FacebookIcon,
    InstagramIcon,
    LinkedInIcon,
    MobileMenuCloseIcon,
    MobileMenuIcon,
    PlusIcon,
    SearchIcon,
    SettingsIcon,
    XIcon,
};

