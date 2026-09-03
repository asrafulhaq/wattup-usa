'use client';

/**
 * The header: brand, scenarios, file actions, theme, sign out, and the two things
 * a user actually came to do.
 *
 * Every action the static tool's header had is still here. What changed is that the
 * eight flat buttons are grouped, and that the two browser dialogs it relied on are
 * gone: `prompt()` for a scenario name and `confirm()` for reset. Both block the
 * whole tab and neither can be styled, so they are proper dialogs now.
 */
import { motion } from 'framer-motion';
import {
    ChevronDown,
    Download,
    ExternalLink,
    FileJson,
    FolderOpen,
    Loader2,
    LogOut,
    Moon,
    Printer,
    RotateCcw,
    Save,
    Sun,
    Trash2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRef, useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useHydrated } from '@/lib/use-hydrated';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export interface TopbarProps {
    scenarioNames: string[];
    defaultScenarioName: string;
    storageAvailable: boolean;
    onSaveScenario: (name: string) => void;
    onLoadScenario: (name: string) => void;
    onDeleteScenario: (name: string) => void;
    onClearStorage: () => void;
    onLoadJson: (file: File) => void;
    onExportJson: () => void;
    onReset: () => void;
    onOpenDocument: () => void;
    onPrint: () => void;
    onSignOut: () => void;
    signingOut: boolean;
    /** Opens the rail as a drawer below lg, where there is no room for a column. */
    railTrigger?: React.ReactNode;
}

function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    // next-themes cannot know the resolved theme until it is on the client, so the
    // icon is held back for one paint rather than rendering the wrong one and
    // tripping a hydration mismatch.
    const mounted = useHydrated();

    // Two states only, by owner decision: light and dark, no "follow the system".
    // resolvedTheme rather than theme, so the button always reflects what is on
    // screen instead of the word stored in localStorage.
    const isDark = resolvedTheme === 'dark';
    const Icon = isDark ? Moon : Sun;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8'
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    aria-label='Change theme'
                >
                    <motion.span
                        key={mounted ? String(isDark) : 'pending'}
                        initial={{ rotate: -25, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.18 }}
                        className='flex'
                    >
                        <Icon className='size-4' />
                    </motion.span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                {mounted ? (isDark ? 'Switch to light' : 'Switch to dark') : 'Theme'}
                <span className='text-muted-foreground block text-[10px]'>
                    The document never changes
                </span>
            </TooltipContent>
        </Tooltip>
    );
}

export function Topbar(props: TopbarProps) {
    const [saveOpen, setSaveOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [clearOpen, setClearOpen] = useState(false);
    const [name, setName] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const openSave = () => {
        setName(props.defaultScenarioName);
        setSaveOpen(true);
    };

    const commitSave = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        props.onSaveScenario(trimmed);
        setSaveOpen(false);
    };

    return (
        // Wraps to a second row rather than overflowing the viewport. The height is
        // a minimum, not a fixed 14, so a wrapped row is not clipped.
        <header className='border-border/60 flex min-h-14 shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1 border-b px-3 py-1.5 sm:gap-x-2 sm:px-4'>
            {props.railTrigger}
            <div className='flex min-w-0 items-center gap-3'>
                {/*
                  * Two files, not one file and a CSS filter. WattUp ships a light
                  * wordmark and a dark one; inverting the light one in light mode
                  * changes the brand colour, which it is not ours to do. Both are
                  * rendered and CSS picks, so there is no flash and no JS.
                  */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src='/proforma/logo_type_dark.svg'
                    alt='WattUpUSA'
                    className='hidden h-5 w-auto sm:block dark:hidden'
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src='/proforma/logo_type_light.svg'
                    alt=''
                    aria-hidden='true'
                    className='hidden h-5 w-auto sm:dark:block'
                />
                <Separator orientation='vertical' className='hidden h-7 sm:block' />
                <div className='hidden min-w-0 leading-tight sm:block'>
                    <div className='truncate text-[13px] font-semibold'>Site Pro-Forma Builder</div>
                    <div className='text-muted-foreground truncate text-[10px] font-medium tracking-wider uppercase'>
                        Host Revenue Model
                    </div>
                </div>
            </div>

            <span className='hidden flex-1 sm:block' />
            <span className='ml-auto sm:hidden' />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 gap-1 px-2 md:px-3'
                        aria-label='Scenarios'
                    >
                        <FolderOpen className='size-4' />
                        <span className='hidden md:inline'>Scenarios</span>
                        <ChevronDown className='hidden size-3 md:block' />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-64'>
                    <DropdownMenuItem onSelect={openSave}>
                        <Save className='size-3.5' />
                        Save this scenario
                    </DropdownMenuItem>
                    {props.scenarioNames.length ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className='text-[10px] tracking-wider uppercase'>
                                Saved on this device
                            </DropdownMenuLabel>
                            {props.scenarioNames.map((n) => (
                                <DropdownMenuItem
                                    key={n}
                                    onSelect={() => props.onLoadScenario(n)}
                                    className='group justify-between gap-2'
                                >
                                    <span className='truncate'>{n}</span>
                                    <span
                                        role='button'
                                        tabIndex={-1}
                                        aria-label={`Delete ${n}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            props.onDeleteScenario(n);
                                        }}
                                        className='text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100'
                                    >
                                        <Trash2 className='size-3' />
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => setClearOpen(true)}
                        className='text-destructive focus:text-destructive'
                    >
                        <Trash2 className='size-3.5' />
                        Clear everything saved here
                    </DropdownMenuItem>
                    {!props.storageAvailable ? (
                        <p className='text-muted-foreground px-2 py-1.5 text-[10px] leading-snug'>
                            This browser is blocking storage, so scenarios last only for this tab.
                        </p>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 gap-1 px-2 md:px-3'
                        aria-label='File'
                    >
                        <FileJson className='size-4' />
                        <span className='hidden md:inline'>File</span>
                        <ChevronDown className='hidden size-3 md:block' />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                    <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                        <FolderOpen className='size-3.5' />
                        Load JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={props.onExportJson}>
                        <Download className='size-3.5' />
                        Export JSON
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => setResetOpen(true)}
                        className='text-destructive focus:text-destructive'
                    >
                        <RotateCcw className='size-3.5' />
                        Reset to defaults
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8'
                        onClick={props.onSignOut}
                        disabled={props.signingOut}
                        aria-label='Sign out'
                    >
                        {props.signingOut ? (
                            <Loader2 className='size-4 animate-spin' />
                        ) : (
                            <LogOut className='size-4' />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>End this session on this device</TooltipContent>
            </Tooltip>

            <Separator orientation='vertical' className='mx-1 hidden h-7 sm:block' />

            <Button
                variant='outline'
                size='sm'
                className='h-8 gap-1.5 px-2 lg:px-3'
                onClick={props.onOpenDocument}
                aria-label='Open document'
            >
                <ExternalLink className='size-4' />
                <span className='hidden lg:inline'>Open document</span>
            </Button>
            <Button
                size='sm'
                className='h-8 gap-1.5 px-2.5 sm:px-3'
                onClick={props.onPrint}
                aria-label='Save as PDF'
            >
                <Printer className='size-4' />
                <span className='hidden sm:inline'>Save as PDF</span>
            </Button>

            <input
                ref={fileRef}
                type='file'
                accept='application/json,.json'
                className='hidden'
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) props.onLoadJson(f);
                    e.target.value = '';
                }}
            />

            <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>Name this scenario</DialogTitle>
                        <DialogDescription>
                            Saved in this browser, on this device. Use Export JSON for a copy you can
                            move or keep.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-2'>
                        <Label htmlFor='scenario-name'>Name</Label>
                        <Input
                            id='scenario-name'
                            value={name}
                            autoFocus
                            placeholder='The site address'
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    commitSave();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setSaveOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={commitSave} disabled={!name.trim()}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear every field back to the defaults?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This clears the inputs, the three images and every gallery image. Saved
                            scenarios are left alone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={props.onReset}
                            className='bg-destructive text-white hover:bg-destructive/90'
                        >
                            Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear everything saved on this device?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Removes every saved scenario and the working copy this tool keeps so it
                            can restore your last session. Worth doing on a shared machine. What is
                            on screen right now stays until you reload.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={props.onClearStorage}
                            className='bg-destructive text-white hover:bg-destructive/90'
                        >
                            Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </header>
    );
}
