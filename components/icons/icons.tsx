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

export { ArrowLeftIcon, ArrowRightIcon };

