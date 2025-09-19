import { useShallow } from 'zustand/react/shallow';

import { storage } from '@/sync/storage';

export function useNativeUpdate(): string | null {
    // Get native update status from global storage
    const nativeUpdateStatus = storage(useShallow((state) => state.nativeUpdateStatus));
    
    // Return the update URL if available, otherwise null
    return nativeUpdateStatus?.updateUrl || null;
}