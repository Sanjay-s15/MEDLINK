'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Common medicine database ───────────────────────────────────────────────
const MEDICINES = [
    // A
    'Aceclofenac', 'Aceclofenac + Paracetamol', 'Acemetacin', 'Acetazolamide',
    'Acyclovir', 'Albendazole', 'Albuterol', 'Allopurinol', 'Alprazolam',
    'Amikacin', 'Amlodipine', 'Amoxicillin', 'Amoxicillin + Clavulanate',
    'Ampicillin', 'Atenolol', 'Atorvastatin', 'Azithromycin', 'Azithral',
    // B
    'Baclofen', 'Beclomethasone', 'Betahistine', 'Betamethasone',
    'Bisacodyl', 'Bisoprolol', 'Bromhexine', 'Budesonide',
    // C
    'Calcitriol', 'Calcium Carbonate', 'Carbamazepine', 'Carvedilol',
    'Cetirizine', 'Cefixime', 'Cefpodoxime', 'Ceftriaxone', 'Cefuroxime',
    'Chlorpheniramine', 'Ciprofloxacin', 'Citalopram', 'Clarithromycin',
    'Clindamycin', 'Clonazepam', 'Clopidogrel', 'Clotrimazole',
    'Co-Amoxiclav', 'Codeine', 'Colchicine',
    // D
    'Dexamethasone', 'Dextromethorphan', 'Diazepam', 'Diclofenac',
    'Digoxin', 'Diltiazem', 'Dolo 650', 'Domperidone', 'Doxycycline',
    'Duloxetine',
    // E
    'Enalapril', 'Erythromycin', 'Esomeprazole', 'Ethambutol', 'Etoricoxib',
    // F
    'Famotidine', 'Fexofenadine', 'Fluconazole', 'Fluoxetine',
    'Folic Acid', 'Furosemide',
    // G
    'Gabapentin', 'Gentamicin', 'Glimepiride', 'Glipizide',
    'Glyceryl Trinitrate', 'Griseofulvin',
    // H
    'Haloperidol', 'Hydrocortisone', 'Hydroxychloroquine', 'Hyoscine',
    // I
    'Ibuprofen', 'Imipramine', 'Insulin (Regular)', 'Insulin (NPH)',
    'Isoniazid', 'Ivermectin',
    // K
    'Ketoconazole', 'Ketoprofen', 'Ketorolac',
    // L
    'Lactulose', 'Lamotrigine', 'Lansoprazole', 'Levocetirizine',
    'Levofloxacin', 'Levothyroxine', 'Lisinopril', 'Loperamide',
    'Loratadine', 'Losartan',
    // M
    'Mebendazole', 'Mefenamic Acid', 'Melatonin', 'Metformin',
    'Methotrexate', 'Methylprednisolone', 'Metoclopramide', 'Metoprolol',
    'Metronidazole', 'Miconazole', 'Mifepristone', 'Montelukast',
    'Multivitamin',
    // N
    'Naproxen', 'Neomycin', 'Nitroglycerin', 'Norfloxacin',
    'Nystatin',
    // O
    'Ofloxacin', 'Omeprazole', 'Ondansetron', 'Oral Rehydration Salts (ORS)',
    'Oxytocin',
    // P
    'Pan D', 'Pantoprazole', 'Paracetamol', 'Paracetamol 500mg',
    'Paracetamol 650mg', 'Phenobarbitone', 'Phenytoin', 'Piroxicam',
    'Prednisolone', 'Prednisone', 'Pregabalin', 'Promethazine',
    'Propranolol', 'Pyrazinamide',
    // Q
    'Quetiapine',
    // R
    'Rabeprazole', 'Ranitidine', 'Rifampicin', 'Risperidone',
    'Rosuvastatin',
    // S
    'Salbutamol', 'Sertraline', 'Simvastatin', 'Sodium Valproate',
    'Spironolactone', 'Sucralfate', 'Sulfamethoxazole + Trimethoprim',
    // T
    'Tamsulosin', 'Telmisartan', 'Tetracycline', 'Theophylline',
    'Tramadol', 'Trazodone',
    // U
    'Ursodeoxycholic Acid',
    // V
    'Valacyclovir', 'Valsartan', 'Vancomycin', 'Vitamin B Complex',
    'Vitamin B12', 'Vitamin C', 'Vitamin D3', 'Voriconazole',
    // W
    'Warfarin',
    // X
    'Xylometazoline',
    // Z
    'Zinc Sulphate', 'Zolpidem',
].sort();

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export default function MedicineAutocomplete({ value, onChange, placeholder = 'Type medicine name…', className = '', required = false }: Props) {
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const suggestions = value.trim().length >= 1
        ? MEDICINES.filter(m => m.toLowerCase().includes(value.toLowerCase())).slice(0, 10)
        : [];

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Reset highlight when suggestions change
    useEffect(() => { setHighlighted(0); }, [value]);

    // Scroll highlighted item into view
    useEffect(() => {
        const el = listRef.current?.children[highlighted] as HTMLElement | undefined;
        el?.scrollIntoView({ block: 'nearest' });
    }, [highlighted]);

    const pick = useCallback((medicine: string) => {
        onChange(medicine);
        setOpen(false);
        inputRef.current?.blur();
    }, [onChange]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
        if (e.key === 'Enter') { e.preventDefault(); pick(suggestions[highlighted]); }
        if (e.key === 'Escape') { setOpen(false); }
    };

    // Highlight matching part in suggestion
    const renderHighlight = (med: string) => {
        const idx = med.toLowerCase().indexOf(value.toLowerCase());
        if (idx === -1 || !value) return <span>{med}</span>;
        return (
            <>
                {med.slice(0, idx)}
                <span className="text-blue-300 font-semibold">{med.slice(idx, idx + value.length)}</span>
                {med.slice(idx + value.length)}
            </>
        );
    };

    return (
        <div ref={wrapRef} className="relative">
            <input
                ref={inputRef}
                value={value}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => value.trim().length >= 1 && setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
                className={className}
            />

            {open && suggestions.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1c2333] border border-white/20 rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto"
                >
                    {suggestions.map((med, i) => (
                        <li
                            key={med}
                            onMouseDown={() => pick(med)}
                            onMouseEnter={() => setHighlighted(i)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition
                ${i === highlighted ? 'bg-blue-600/30 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                        >
                            <span className="text-blue-500 text-xs shrink-0">💊</span>
                            {renderHighlight(med)}
                        </li>
                    ))}
                    {/* Allow freetext that doesn't match */}
                    {!MEDICINES.some(m => m.toLowerCase() === value.toLowerCase()) && value.trim() && (
                        <li
                            onMouseDown={() => pick(value.trim())}
                            onMouseEnter={() => setHighlighted(suggestions.length)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition border-t border-white/10
                ${highlighted === suggestions.length ? 'bg-blue-600/30 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <span className="text-slate-500 text-xs shrink-0">✚</span>
                            Use "<span className="text-white font-medium">{value.trim()}</span>"
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
