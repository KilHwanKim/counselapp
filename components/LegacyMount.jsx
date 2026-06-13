'use client';

import { useEffect, useRef } from 'react';

/**
 * Runs legacy mount once after client markup is in the DOM.
 */
export default function LegacyMount({ mount }) {
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;
        mount();
    }, [mount]);

    return null;
}
