import {
    SET_LAYER_VISIBILITY,
    SET_LAYER_DATA,
    SET_SELECTED_LAYER,
    SET_ASSET_COUNT,
    SET_ASSET_NAME,
    SET_LOADING_DATA,
    SET_LAYER_OPTION,
    SET_LAYER_ERROR
} from "../redux-constants";

// Generic layer actions
export function setLayerVisibility(layerKey, isVisible) {
    return {
        type: SET_LAYER_VISIBILITY,
        payload: { layerKey, isVisible },
    };
}

export function setLayerData(layerKey, data, isInitial = false) {
    // If isInitial, set isLoading true (request started, no data yet)
    // If not isInitial, set isLoading false if data is not null, true if data is null
    let isLoading = true;
    if (data !== null) {
        isLoading = false;
    }
    return {
        type: SET_LAYER_DATA,
        payload: { layerKey, isLoading, data },
    };
}

export function setLayerOption(layerKey, selectedOption) {
    return {
        type: SET_LAYER_OPTION,
        payload: { layerKey, selectedOption },
    };
}

export function setSelectedLayer(layer) {
    return {
        type: SET_SELECTED_LAYER,
        payload: layer,
    };
}

export function setAssetsCount(assetsCount) {
    return {
        type: SET_ASSET_COUNT,
        payload: assetsCount,
    };
}

export function setAssetsName(assetsName) {
    return {
        type: SET_ASSET_NAME,
        payload: assetsName,
    };
}

export function setLoadingData(flag) {
    return {
        type: SET_LOADING_DATA,
        payload: flag,
    };
}

export function setLayerError(layerKey, error) {
    return {
        type: SET_LAYER_ERROR,
        payload: { layerKey, error },
    };
}