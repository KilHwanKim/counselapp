'use client';

import { useEffect } from 'react';

/**
 * Runs legacy mount after client markup is in the DOM.
 * React Strict Mode remounts the tree in dev; do not skip the second run.
 */
export default function LegacyMount({ mount }) {
    useEffect(() => {
        // mount가 정리 함수를 반환하면 언마운트 시 실행 (리스너 중복 등록 방지)
        const cleanup = mount();
        return typeof cleanup === 'function' ? cleanup : undefined;
    }, [mount]);

    return null;
}
