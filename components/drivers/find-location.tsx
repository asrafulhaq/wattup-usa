'use client';
import {
    CarretDownIcon,
    CarretUpIcon,
    CloseIcon,
    SearchIcon,
    SettingsIcon,
} from '@/components/icons/icons';
import { FadeUp } from '@/components/ui/fade-up';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

const MapMarker = ({
    active = false,
    className,
}: {
    active?: boolean;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'absolute z-10 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group',
                className
            )}>
            {active ? (
                <>
                    {/* Pulse effect for active target */}
                    <div className='absolute w-[24px] h-[24px] md:w-[48px] md:h-[48px] bg-[#0066FF] rounded-full opacity-20 animate-ping'></div>
                    {/* Active Solid Marker */}
                    <div className='w-[24px] h-[24px] md:w-[48px] md:h-[48px] bg-[#0066FF] rounded-full flex items-center justify-center shadow-[0_4px_16px_text-primary/30] z-10 group-hover:scale-105 transition-transform'>
                        <div className='w-[6px] h-[6px] md:w-[10px] md:h-[10px] bg-white rounded-full'></div>
                    </div>
                </>
            ) : (
                <div className='w-[24px] h-[24px] md:w-[48px] md:h-[48px] bg-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform'>
                    <div className='w-[6px] h-[6px] md:w-[10px] md:h-[10px] bg-dark rounded-full'></div>
                </div>
            )}
        </div>
    );
};

export function FindLocation() {
    const [openConnectors, setOpenConnectors] = useState(true);
    const [openOperators, setOpenOperators] = useState(false);
    const [openStation, setOpenStation] = useState(false);
    const [query, setQuery] = useState('');
    // Hardcoded Active Station for Figma matching
    const activeStation = {
        name: 'Station name',
        location: 'Los Angeles',
        power: '150kW',
        amenities: ['Available 24/7', 'Low station occupancy', 'Fast charging'],
        accessHours: 'Available 24/7',
        roadsideAssistance: '(000)-000-0000',
    };

    return (
        <section className='relative w-full max-w-[1444px] mx-auto common-section-padding '>
            {/* Header */}
            <div className='mb-5 md:mb-[40px] container mx-auto'>
                <FadeUp>
                    <h1 className='headline-dark mb-4 md:mb-6'>
                        Find Charging Locations
                    </h1>
                </FadeUp>
                <FadeUp delay={0.1}>
                    <p className='text-description text-dark font-normal!'>
                        Fast, reliable charging stations located where you live,
                        work, and travel.
                    </p>
                </FadeUp>
            </div>

            {/* Main Content Layout */}
            <div className='flex flex-col lg:flex-row gap-6 lg:gap-14 container mx-auto items-stretch'>
                {/* Left Sidebar */}
                <div className='w-full lg:w-[420px] shrink-0 flex flex-col'>
                    {/* Search & Filters Row */}
                    <div className='flex items-center gap-3 mb-4 md:mb-6'>
                        {/* Search Input */}
                        <div className='flex-1 h-[48px] bg-gray/30 rounded-[8px] flex items-center p-[14px] gap-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all'>
                            <SearchIcon className='shrink-0' />
                            <input
                                type='text'
                                placeholder='Enter the city where you are looking for a c...'
                                className='w-full bg-transparent border-none outline-none text-[14px] text-dark/50 font-normal placeholder:text-dark/40'
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        </div>
                        {/* Filters Button */}
                        <button
                            onClick={() => setQuery('')}
                            className='h-[48px] px-[14px] bg-gray/30 rounded-[8px] flex items-center justify-center gap-[10px] hover:bg-gray/50 transition-colors'>
                            <span className='text-[14px] hidden md:block font-medium text-dark'>
                                Filters
                            </span>
                            {query ? (
                                <CloseIcon className='w-3 h-3 opacity-60' />
                            ) : (
                                <SettingsIcon />
                            )}
                        </button>
                    </div>

                    {/* Connectors Accordion */}
                    <div className='hidden md:block border-b border-dark/20 py-3'>
                        <button
                            onClick={() => setOpenConnectors(!openConnectors)}
                            className='w-full flex items-center justify-between h-[48px] group'>
                            <span className='text-[16px] leading-[130%] tracking-[-3%] font-semibold text-dark'>
                                Connectors
                            </span>
                            {openConnectors ? (
                                <CarretUpIcon />
                            ) : (
                                <CarretDownIcon />
                            )}
                        </button>

                        {openConnectors && (
                            <div className='flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200'>
                                {['CCS', 'Tesla', 'Type 1', 'Type 2'].map(
                                    type => (
                                        <button
                                            key={type}
                                            className={cn(
                                                'px-4 py-2 rounded-[6px] text-[14px] font-medium transition-colors',
                                                type === 'CCS' ||
                                                    type === 'Tesla'
                                                    ? 'bg-dark text-white'
                                                    : 'bg-[#F4F4F5] text-dark hover:bg-[#E4E4E5]'
                                            )}>
                                            {type}
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* Operators Accordion */}
                    <div className='hidden md:block border-b border-dark/20 py-3 pb-6'>
                        <button
                            onClick={() => setOpenOperators(!openOperators)}
                            className='w-full flex items-center justify-between h-[48px] group'>
                            <span className='text-[16px] leading-[130%] tracking-[-3%] font-semibold text-dark'>
                                Operators
                            </span>
                            {openOperators ? (
                                <CarretUpIcon />
                            ) : (
                                <CarretDownIcon />
                            )}
                        </button>
                    </div>

                    {/* Active Station Details */}
                    <div className='md:mt-6  mt-2 flex flex-col mb-0!'>
                        {/* Title & Power */}
                        <div
                            className='flex justify-between items-start cursor-pointer md:cursor-default'
                            onClick={() => setOpenStation(!openStation)}>
                            <div>
                                <h3 className='text-[24px] md:text-[28px] leading-[110%] tracking-[-3%] text-dark mb-1 md:mb-2'>
                                    <span className='font-bold'>
                                        {activeStation.name}
                                    </span>
                                    <span className='font-normal'>
                                        , {activeStation.location}
                                    </span>
                                </h3>
                                <p className='text-[20px] text-dark/50 font-semibold '>
                                    {activeStation.power}
                                </p>
                            </div>
                            <div className='md:hidden mt-2'>
                                {openStation ? (
                                    <CarretUpIcon />
                                ) : (
                                    <CarretDownIcon />
                                )}
                            </div>
                        </div>

                        {/* Expandable Details */}
                        <div
                            className={cn(
                                'grid transition-all duration-300 ease-in-out md:grid-rows-[1fr] md:opacity-100 md:mt-8',
                                openStation
                                    ? 'grid-rows-[1fr] opacity-100 mt-6'
                                    : 'grid-rows-[0fr] opacity-0 mt-0'
                            )}>
                            <div className='flex-col gap-6 md:gap-8 flex overflow-hidden'>
                                {/* Amenities */}
                                <div>
                                    <h4 className='text-[20px] leading-[130%] tracking-[-3%] font-semibold text-dark mb-4'>
                                        Amenities:
                                    </h4>
                                    <ul className='flex flex-col gap-2'>
                                        {activeStation.amenities.map(
                                            (amenity, i) => (
                                                <li
                                                    key={i}
                                                    className='text-[14px] text-dark/70 font-normal'>
                                                    {amenity}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>

                                {/* Access Hours */}
                                <div>
                                    <h4 className='text-[20px] leading-[130%] tracking-[-3%] font-semibold text-dark mb-4'>
                                        Access Hours:
                                    </h4>
                                    <p className='text-[14px] text-dark/70 font-normal'>
                                        {activeStation.accessHours}
                                    </p>
                                </div>

                                {/* Roadside Assistance */}
                                <div>
                                    <h4 className='text-[20px] leading-[130%] tracking-[-3%] font-semibold text-dark mb-4'>
                                        Roadside Assistance:
                                    </h4>
                                    <p className='text-[14px] text-dark/70 font-normal mb-2'>
                                        {activeStation.roadsideAssistance}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Directions Button */}
                        <div className='mt-4 md:mt-8'>
                            <button className='h-[48px] md:h-[45px] px-[24px] inline-flex bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] transition-colors tracking-[-3%] leading-[130%] items-center justify-center shadow-btn'>
                                Directions
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Map Container */}
                <div className='flex-1 w-full h-[246px] min-h-[246px] md:min-h-[600px] lg:h-[727px] relative rounded-[12px] md:rounded-[16px] overflow-hidden border border-gray/50 bg-gray/50 mb-0 md:mb-0'>
                    {/* Fixed Height required for Image fill to work perfectly relative to parent */}
                    <Image
                        src='/assets/images/map.png'
                        alt='Charging Stations Map'
                        fill
                        className='object-cover object-center bg-gray/50 pointer-events-none'
                        priority
                    />

                    {/* 
                        Map Markers Overlay 
                        Positions are based on exact percentage values so they scale cleanly.
                    */}

                    {/* Active Target Marker (Central - Fresno/Bakersfield area) */}
                    <MapMarker
                        active={true}
                        className='max-md:left-[18.6%] max-md:top-[34.1%] md:left-[27.5%] md:top-[33.4%]'
                    />

                    {/* Top Right Marker (Cedar City area) */}
                    <MapMarker className='max-md:left-[83.3%] max-md:top-[36.1%] md:left-[76.5%] md:top-[22.4%]' />

                    {/* Middle Right Marker (Sedona area) */}
                    <MapMarker className='max-md:left-[83.3%] max-md:top-[64.6%] md:left-[77%] md:top-[53%]' />

                    {/* Bottom Marker (Anaheim/LA area) */}
                    <MapMarker className='max-md:left-[43.1%] max-md:top-[81.3%] md:left-[42.7%] md:top-[70.8%]' />
                </div>
            </div>
        </section>
    );
}

