'use client';

import { useEffect } from 'react';

/**
 * Runs legacy mount after client markup is in the DOM.
 * React Strict Mode remounts the tree in dev; do not skip the second run.
 */
export default function LegacyMount({ mount }) {
    useEffect(() => {
        mount();
    }, [mount]);

    return null;
}
