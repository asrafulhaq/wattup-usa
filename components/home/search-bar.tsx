'use client';

import { searchArticles } from '@/app/_actions/postActions';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CiSearch } from 'react-icons/ci';

export default function SearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.trim().length > 1) {
                const results = await searchArticles(query);
                setSuggestions(results);
                setIsOpen(true);
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (value.trim() === '' && pathname === '/search') {
            router.push('/');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
        } else {
            router.push('/');
        }
    };

    const highlightMatch = (title: string, searchQuery: string) => {
        const lowerTitle = title.toLowerCase();
        const lowerQuery = searchQuery.toLowerCase();
        const matchIndex = lowerTitle.indexOf(lowerQuery);

        if (matchIndex === -1) {
            return (
                <span className='text-text-muted text-sm font-normal'>
                    {title}
                </span>
            );
        }

        const before = title.substring(0, matchIndex);
        const match = title.substring(
            matchIndex,
            matchIndex + searchQuery.length
        );
        const after = title.substring(matchIndex + searchQuery.length);

        return (
            <>
                {before && (
                    <span className='text-text-muted text-sm font-normal'>
                        {before}
                    </span>
                )}
                <span className='text-primary font-medium text-sm'>
                    {match}
                </span>
                {after && (
                    <span className='text-text-muted text-sm font-normal'>
                        {after}
                    </span>
                )}
            </>
        );
    };

    return (
        <div
            ref={containerRef}
            className='relative w-full md:max-w-[490px] h-[48px] z-20'>
            <form
                onSubmit={handleSubmit}
                className='w-full h-full flex items-center bg-search rounded-full px-4 gap-3 group transition-shadow focus-within:ring-1 focus-within:ring-border'>
                <CiSearch className='size-5 text-search-suggestion shrink-0' />
                <input
                    type='text'
                    value={query}
                    placeholder='Search'
                    onChange={handleChange}
                    onFocus={() => query.trim().length > 1 && setIsOpen(true)}
                    className='flex-1 h-full bg-transparent text-[14px] text-primary font-normal focus:outline-none placeholder-search-suggestion  leading-none tracking-[-0.02em] py-1'
                />
            </form>

            {isOpen && suggestions.length > 0 && (
                <div className='absolute top-full left-0 w-full mt-1 bg-search border border-border rounded-2xl shadow-lg overflow-hidden py-2'>
                    {suggestions.map(item => (
                        <Link
                            key={item.id}
                            href={`/posts/${item.slug}`}
                            onClick={() => {
                                setQuery(item.title);
                                setIsOpen(false);
                            }}
                            className='block px-5 py-3 hover:bg-search-suggestion/10 transition-colors'>
                            <span className='text-sm'>
                                {highlightMatch(item.title, query)}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

