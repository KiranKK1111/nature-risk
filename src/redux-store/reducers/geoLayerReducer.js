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

const INITIAL_STATE = {
    layers: {}, // { [layerKey]: { visible: boolean, data: any } }
    selectedLayer: '',
    assetsCount: 0,
    assetsName: '',
    loadingData: false,
};

export const geoLayerReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case SET_LAYER_VISIBILITY: {
            const { layerKey, isVisible } = action.payload;
                let selectedOption = state.layers[layerKey]?.selectedOption;
                if (isVisible && !selectedOption) {
                    if (layerKey === 'show_MSA_Layer') selectedOption = 'SSP1';
                    if (layerKey === 'show_Land_Use_Layer') selectedOption = '1992';
                }
                return {
                    ...state,
                    layers: {
                        ...state.layers,
                        [layerKey]: {
                            ...state.layers[layerKey],
                            visible: isVisible,
                            ...(selectedOption ? { selectedOption } : {}),
                        },
                    },
                };
        }
        case SET_LAYER_DATA: {
            const { layerKey, data, isLoading } = action.payload;
            return {
                ...state,
                layers: {
                    ...state.layers,
                    [layerKey]: {
                        ...state.layers[layerKey],
                        data,
                        loading: isLoading,
                    },
                },
            };
        }
        case SET_LAYER_OPTION : {
            const { layerKey, selectedOption } = action.payload;
            return {
                ...state,
                layers: {
                    ...state.layers,
                    [layerKey]: {
                        ...state.layers[layerKey],
                        selectedOption,
                    },
                },
            };
        }
        case SET_SELECTED_LAYER:
            return { ...state, selectedLayer: action.payload };
        case SET_ASSET_COUNT:
            return { ...state, assetsCount: action.payload };
        case SET_ASSET_NAME:
            return { ...state, assetsName: action.payload };
        case SET_LAYER_ERROR: {
            const { layerKey, error } = action.payload;
            return {
                ...state,
                layers: {
                    ...state.layers,
                    [layerKey]: {
                        ...state.layers[layerKey],
                        loading: false,
                        error,
                    },
                },
            };
        }
        case SET_LOADING_DATA:
            return { ...state, loadingData: action.payload };
        default:
            return state || INITIAL_STATE;
    }
}