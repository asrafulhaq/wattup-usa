import localFont from 'next/font/local';

export const helvetica = localFont({
    src: [
        {
            path: '../public/fonts/helvetica/helvetica-light.ttf',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../public/fonts/helvetica/Helvetica.ttf',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../public/fonts/helvetica/Helvetica-Bold.ttf',
            weight: '700',
            style: 'normal',
        },
    ],
    variable: '--',
    display: 'swap',
});

export const helveticaNeue = localFont({
    src: [
        {
            path: '../public/fonts/helvetica-neue/HelveticaNeueLight.otf',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../public/fonts/helvetica-neue/HelveticaNeueRoman.otf',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../public/fonts/helvetica-neue/HelveticaNeueMedium.otf',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../public/fonts/helvetica-neue/HelveticaNeueBold.otf',
            weight: '700',
            style: 'normal',
        },
    ],
    variable: '--',
    display: 'swap',
});
