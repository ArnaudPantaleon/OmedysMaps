:root {
    --primary: #009597;
    --primary-glow: rgba(0, 149, 151, 0.2);
    --glass-bg: rgba(255, 255, 255, 0.75);
    --glass-blur: blur(20px) saturate(180%);
    --glass-border: rgba(255, 255, 255, 0.5);
    --text-main: #1e293b;
    --text-muted: #64748b;
}

@media (prefers-color-scheme: dark) {
    :root {
        --glass-bg: rgba(15, 23, 42, 0.85);
        --glass-border: rgba(255, 255, 255, 0.1);
        --text-main: #f1f5f9;
        --text-muted: #94a3b8;
    }
}

/* --- BASE & BENTO --- */
#map { height: 100vh; width: 100vw; z-index: 1; }

.bento-wrapper {
    position: fixed; top: 20px; left: 20px; z-index: 1000;
    display: flex; flex-direction: column; gap: 12px; width: 340px;
}

.bento-row { display: flex; gap: 10px; height: 56px; }

.bento-tile {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: 24px; padding: 14px 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.bento-action {
    width: 56px; height: 56px; border: none; border-radius: 18px;
    background: var(--primary); color: white; cursor: pointer;
    display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px;
    box-shadow: 0 4px 15px var(--primary-glow);
}

.bento-search { flex-grow: 1; display: flex; align-items: center; gap: 10px; border-radius: 28px; }
.bento-search input { background: transparent; border: none; outline: none; width: 100%; color: var(--text-main); font-weight: 600; }
.bento-search i { color: var(--primary); }

.bento-stats { justify-content: space-between; border-radius: 28px; margin-top: 5px; }

/* --- FILTERS --- */
.bento-filters { display: none; margin-top: 8px; max-height: 60vh; overflow-y: auto; }
.bento-filters.open { display: block; }

.filter-item {
    display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px;
    background: rgba(255,255,255,0.3); border: 1px solid var(--glass-border);
    border-radius: 16px; cursor: pointer; transition: 0.2s;
}
.filter-item:hover { border-color: var(--primary); background: var(--glass-bg); }

/* --- POPUP BP3 --- */
.bp3-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; }
.bp3-popup .leaflet-popup-tip { display: none; }

.bp3 {
    background: var(--glass-bg); backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border); border-radius: 22px;
    width: 310px; overflow: hidden; color: var(--text-main);
    box-shadow: 0 15px 45px rgba(0,0,0,0.2);
}
.bp3-header { padding: 18px; border-bottom: 1px solid var(--glass-border); position: relative; }
.bp3-title { font-size: 16px; font-weight: 800; line-height: 1.3; margin-top: 5px; }

.bp3-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px; }
.bp3-tile { 
    background: rgba(255,255,255,0.4); padding: 10px; border-radius: 14px; 
    border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;
}
.bp3-tile.bp3-wide { grid-column: span 2; }
.bp3-tile i { color: var(--primary); font-size: 12px; margin-bottom: 2px; }
.bp3-tile-label { font-size: 9px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
.bp3-tile-value { font-size: 12px; font-weight: 700; }

.bp3-footer { display: flex; gap: 10px; padding: 0 15px 15px; }
.bp3-btn {
    flex: 1; border: none; padding: 10px; border-radius: 12px; cursor: pointer;
    font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.bp3-btn--copy { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-main); }
.bp3-btn--maps { background: var(--primary); color: white; }
