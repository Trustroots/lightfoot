import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
import type { SingleProperties } from './processors/types';

export const mapStore = $state({
  sidebarOpen: true,
  selectedFeature: null as SingleProperties | null,
  selectedUser: null as NDKUserProfile | null,
  isAddingSpot: false,
  // Default to showing only verified boxes for new visitors / no explicit override
  showVerifiedOnly: true,
  currentCoords: null as [number, number] | null,
  currentZoom: null as number | null,
});

export const toggleSidebar = () => {
  mapStore.sidebarOpen = !mapStore.sidebarOpen;
};

export const closeSidebar = () => {
  mapStore.sidebarOpen = false;
};

export const openSidebar = () => {
  mapStore.sidebarOpen = true;
};

export const setSelectedFeature = (feature: SingleProperties | null) => {
  mapStore.selectedUser = null;
  mapStore.selectedFeature = feature;
};

export const setSelectedUser = (user: NDKUserProfile | null) => {
  mapStore.selectedFeature = null;
  mapStore.selectedUser = user;
};

export const setIsAddingSpot = (isAdding: boolean) => {
  mapStore.isAddingSpot = isAdding;
};

export const setShowVerifiedOnly = (show: boolean) => {
  mapStore.showVerifiedOnly = show;
};

export const clearSelection = () => {
  mapStore.isAddingSpot = false;
  mapStore.selectedFeature = null;
  mapStore.selectedUser = null;
};
