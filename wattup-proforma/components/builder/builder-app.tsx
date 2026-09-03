'use client';

/**
 * The builder. Owns the state; everything below it is presentation.
 *
 * This replaces app.js's module-level `let INPUTS`, `let IMAGES`, `let GALLERY`
 * and the full `renderForm()` re-render that followed every keystroke. The engine
 * underneath is the same code, proved byte-identical by
 * tests/proforma/engine-parity.test.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { loadAssets, fileToDataUrl } from '@/lib/proforma/assets';
import { renderDoc, type ProformaAssets } from '@/lib/proforma/document';
import { evpinFetchText, parseEvpin } from '@/lib/proforma/evpin';
import { buildModel, type ProformaInputs, type ProformaModel } from '@/lib/proforma/model';
import {
    clearAll,
    isStorageAvailable,
    persistLast,
    readScenarios,
    restoreLast,
    saveScenario as writeScenario,
    deleteScenario as removeScenario,
} from '@/lib/proforma/scenarios';
import {
    applyEvpin,
    deepClone,
    EMPTY_IMAGES,
    freshInputs,
    MIN_EVPIN_TEXT,
    mergeLoadedInputs,
    mergeScenario,
    pageCountFor,
    REFERENCE_LOCATION,
    setPath,
    slugFor,
    type EvpinState,
    type GalleryItem,
    type ImageSlot,
    type ImageSlots,
} from '@/lib/proforma/state';
import { useHydrated } from '@/lib/use-hydrated';
import { BuilderSkeleton } from './builder-skeleton';
import { KpiStrip } from './kpi-strip';
import { PreviewFrame, type PreviewHandle } from './preview-frame';
import { Rail } from './rail';
import { Topbar } from './topbar';

const DPI = 96;
const PAGE_W_IN = 8.5;

/**
 * The hydration gate.
 *
 * The builder's opening state comes out of localStorage, which exists only in the
 * browser, so the server cannot render it and a naive read would be a hydration
 * mismatch. Rather than render defaults and then correct them in an effect (a
 * second full pass, and a visible flash of the wrong site), the interactive tree is
 * not mounted until hydration is done, and its state initialisers then read the
 * browser directly. The skeleton it shows first is the same one loading.tsx uses.
 */
export function BuilderApp() {
    const hydrated = useHydrated();
    if (!hydrated) return <BuilderSkeleton />;
    return <Builder />;
}

function Builder() {
    // Read once and share: three initialisers each calling restoreLast() would
    // parse the same JSON three times on mount.
    const [restored] = useState(restoreLast);

    // Initialisers, not an effect: this tree only ever renders in the browser, so
    // the restored session is present on its very first render rather than
    // arriving in a second pass that flashes the wrong site.
    const [inputs, setInputs] = useState<ProformaInputs>(() => {
        if (restored) return restored.inputs;
        const seeded = freshInputs();
        seeded.location = { ...REFERENCE_LOCATION };
        return seeded;
    });
    const [images, setImages] = useState<ImageSlots>(() => restored?.images ?? EMPTY_IMAGES);
    const [gallery, setGallery] = useState<GalleryItem[]>(() => restored?.gallery ?? []);
    const [evpin, setEvpin] = useState<EvpinState>({ status: '', detail: '' });
    const [assets, setAssets] = useState<ProformaAssets | null>(null);
    const [scenarios, setScenarios] = useState<string[]>(() => Object.keys(readScenarios()));
    const [storageOk] = useState(() => isStorageAvailable());
    const [zoom, setZoom] = useState(0.62);
    const [signingOut, setSigningOut] = useState(false);

    const previewRef = useRef<PreviewHandle>(null);
    const viewerRef = useRef<HTMLDivElement>(null);

    /*
     * The brand assets. The static tool awaited three fetches one after another
     * before it drew anything at all; here the panel is already interactive and
     * only the preview waits on them.
     */
    useEffect(() => {
        let live = true;
        loadAssets().then((a) => {
            if (live) setAssets(a);
        });
        return () => {
            live = false;
        };
    }, []);

    /** Fit the document to the viewer, as "Fit width" and the first paint both do. */
    const fitWidth = useCallback(() => {
        const avail = (viewerRef.current?.clientWidth ?? 0) - 48;
        if (avail <= 0) return;
        setZoom(Math.max(0.25, Math.min(1.0, avail / (PAGE_W_IN * DPI))));
    }, []);

    useEffect(() => {
        fitWidth();
        window.addEventListener('resize', fitWidth);
        return () => window.removeEventListener('resize', fitWidth);
    }, [fitWidth]);

    /*
     * The model, and the document.
     *
     * Both are memoised on the state they read, which is what replaced the
     * requestAnimationFrame debounce: React batches the state update, and these only
     * recompute when an input they depend on actually changed. Typing in a field
     * that the document does not print costs one model build, not a re-render of
     * every control.
     */
    const model: ProformaModel = useMemo(() => buildModel(inputs), [inputs]);

    const pageCount = pageCountFor(gallery.length);

    const docAssets = useMemo<ProformaAssets | null>(() => {
        if (!assets) return null;
        return {
            ...assets,
            // The shipped station render is the cover until someone uploads one.
            cover: images.cover || assets.cover_default,
            ...(images.aerial ? { aerial: images.aerial } : {}),
            ...(images.design ? { design: images.design } : {}),
            gallery,
        };
    }, [assets, images, gallery]);

    const html = useMemo(
        () => (docAssets ? renderDoc(model, docAssets) : ''),
        [model, docAssets]
    );

    /* Keep the working copy on the device so a reload does not lose the site. */
    useEffect(() => {
        persistLast({ inputs, images, gallery });
    }, [inputs, images, gallery]);

    /* ---------------- field edits ---------------- */

    const onFieldChange = useCallback((path: string, value: unknown) => {
        setInputs((prev) => {
            const next = deepClone(prev);
            setPath(next as unknown as Record<string, unknown>, path, value);
            return next;
        });
    }, []);

    /* ---------------- images ---------------- */

    const onImagePick = useCallback(async (slot: ImageSlot, file: File) => {
        try {
            const src = await fileToDataUrl(file);
            setImages((prev) => ({ ...prev, [slot]: src }));
        } catch {
            toast.error('That image could not be read');
        }
    }, []);

    const onImageClear = useCallback((slot: ImageSlot) => {
        setImages((prev) => ({ ...prev, [slot]: null }));
    }, []);

    const onGalleryAdd = useCallback(async (files: FileList) => {
        const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
        if (!list.length) return;
        const read = await Promise.all(
            list.map((f) => fileToDataUrl(f).catch(() => null))
        );
        const added = read.filter((s): s is string => Boolean(s)).map((src) => ({ src, caption: '' }));
        if (added.length) setGallery((prev) => [...prev, ...added]);
        if (added.length < list.length) toast.error('Some images could not be read');
    }, []);

    const onGalleryCaption = useCallback((index: number, caption: string) => {
        setGallery((prev) => prev.map((g, i) => (i === index ? { ...g, caption } : g)));
    }, []);

    const onGalleryMove = useCallback((index: number, direction: -1 | 1) => {
        setGallery((prev) => {
            const target = index + direction;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }, []);

    const onGalleryRemove = useCallback((index: number) => {
        setGallery((prev) => prev.filter((_, i) => i !== index));
    }, []);

    /* ---------------- EVpin ---------------- */

    const runEvpin = useCallback(
        async (mode: 'url' | 'text', raw: string) => {
            let text = '';
            if (mode === 'url') {
                const u = raw.trim();
                if (!u) {
                    setEvpin({ status: 'warn', detail: 'Paste the EVpin report link first.' });
                    return;
                }
                setEvpin({ status: 'busy', detail: 'Reading the report…' });
                try {
                    text = (await evpinFetchText(u)).text;
                } catch (e) {
                    setEvpin({
                        status: 'warn',
                        detail: `${(e as Error).message}. Open the report, select all, and paste the text below instead.`,
                    });
                    return;
                }
            } else {
                text = raw.trim();
                if (text.length < MIN_EVPIN_TEXT) {
                    setEvpin({
                        status: 'warn',
                        detail: 'Paste more of the report — that is too short to read.',
                    });
                    return;
                }
            }

            const next = deepClone(inputs);
            const filled = applyEvpin(next, parseEvpin(text));
            if (!filled.length) {
                setEvpin({
                    status: 'warn',
                    detail: 'Nothing recognisable in that report. Paste the full report text and try again, or fill the fields by hand.',
                });
                return;
            }
            setInputs(next);
            setEvpin({
                status: 'ok',
                detail: `Filled ${filled.length} field${filled.length > 1 ? 's' : ''}: ${filled.join(' · ')}`,
            });
            toast.success(`EVpin report imported — ${filled.length} fields filled`);
        },
        [inputs]
    );

    /* ---------------- documents out ---------------- */

    const download = useCallback((name: string, content: string, mime: string) => {
        const blob = new Blob([content], { type: mime });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, []);

    const openDocument = useCallback(() => {
        const content = previewRef.current?.currentHtml() ?? html;
        const url = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
        const w = window.open(url, '_blank');
        if (!w) {
            download(`${slugFor(inputs)}.html`, content, 'text/html');
            toast('Popup blocked — downloaded the document instead');
        }
    }, [html, inputs, download]);

    const printDocument = useCallback(() => {
        if (!previewRef.current?.print()) openDocument();
    }, [openDocument]);

    const exportJson = useCallback(() => {
        download(
            `${slugFor(inputs)}_inputs.json`,
            JSON.stringify(inputs, null, 2),
            'application/json'
        );
        toast.success('inputs.json downloaded — drop it into the Python pipeline as-is');
    }, [inputs, download]);

    const loadJson = useCallback((file: File) => {
        const fr = new FileReader();
        fr.onload = () => {
            try {
                setInputs(mergeLoadedInputs(JSON.parse(String(fr.result))));
                toast.success('Inputs loaded');
            } catch {
                toast.error('That file is not valid JSON');
            }
        };
        fr.readAsText(file);
    }, []);

    /* ---------------- scenarios and session ---------------- */

    const refreshScenarios = () => setScenarios(Object.keys(readScenarios()));

    const saveScenario = useCallback((name: string) => {
        const ok = writeScenario(name, deepClone(inputs));
        refreshScenarios();
        toast[ok ? 'success' : 'error'](
            ok
                ? `Saved "${name}" on this device`
                : `Could not save "${name}" — this browser is blocking storage`
        );
    }, [inputs]);

    const loadScenario = useCallback((name: string) => {
        const saved = readScenarios()[name];
        if (!saved) return;
        setInputs(mergeScenario(saved));
        toast.success(`Loaded "${name}"`);
    }, []);

    const deleteScenario = useCallback((name: string) => {
        removeScenario(name);
        refreshScenarios();
        toast(`Deleted "${name}"`);
    }, []);

    const clearStorage = useCallback(() => {
        clearAll();
        refreshScenarios();
        toast.success('Cleared everything this tool had saved on this device');
    }, []);

    const reset = useCallback(() => {
        setInputs(freshInputs());
        setImages(EMPTY_IMAGES);
        setGallery([]);
        setEvpin({ status: '', detail: '' });
        toast('Reset to the WattUpUSA defaults');
    }, []);

    const signOutNow = useCallback(async () => {
        setSigningOut(true);
        try {
            await fetch('/api/auth/sign-out', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: '{}',
            });
        } catch {
            /* the redirect below is what matters; a failed call still leaves the tool */
        }
        // A hard navigation, deliberately. Signing out has to leave nothing of the
        // site behind, and router.push would keep this component's inputs, images
        // and gallery alive in memory on the next screen.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login';
    }, []);

    return (
        <div className='flex h-dvh flex-col overflow-hidden'>
            <Topbar
                scenarioNames={scenarios}
                defaultScenarioName={inputs.location.address || ''}
                storageAvailable={storageOk}
                onSaveScenario={saveScenario}
                onLoadScenario={loadScenario}
                onDeleteScenario={deleteScenario}
                onClearStorage={clearStorage}
                onLoadJson={loadJson}
                onExportJson={exportJson}
                onReset={reset}
                onOpenDocument={openDocument}
                onPrint={printDocument}
                onSignOut={signOutNow}
                signingOut={signingOut}
            />

            <div className='flex min-h-0 flex-1'>
                <aside className='border-border/60 w-[340px] shrink-0 border-r'>
                    <Rail
                        inputs={inputs}
                        images={images}
                        gallery={gallery}
                        evpin={evpin}
                        onFieldChange={onFieldChange}
                        onImagePick={onImagePick}
                        onImageClear={onImageClear}
                        onGalleryAdd={onGalleryAdd}
                        onGalleryCaption={onGalleryCaption}
                        onGalleryMove={onGalleryMove}
                        onGalleryRemove={onGalleryRemove}
                        onEvpinUrl={(u) => runEvpin('url', u)}
                        onEvpinText={(t) => runEvpin('text', t)}
                    />
                </aside>

                <main className='flex min-w-0 flex-1 flex-col'>
                    <KpiStrip model={model} />
                    <PreviewFrame
                        ref={previewRef}
                        html={html}
                        pageCount={pageCount}
                        zoom={zoom}
                        onZoomChange={setZoom}
                        onFitWidth={fitWidth}
                        viewerRef={viewerRef}
                    />
                </main>
            </div>
        </div>
    );
}
