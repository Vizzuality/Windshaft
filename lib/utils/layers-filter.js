'use strict';

module.exports = function layersFilter (mapConfig, layerFilter) {
    layerFilter = defaultLayerFilter(layerFilter);

    let filteredLayers = [];

    if (typeof layerFilter === 'string') {
        filteredLayers = resolveStringFilter(mapConfig, layerFilter);
    } else if (!Array.isArray(layerFilter)) {
        filteredLayers = [layerFilter];
    } else {
        filteredLayers = layerFilter;
    }

    if (!filteredLayers.every(Number.isFinite)) {
        throw new Error('Invalid layer filtering');
    }

    filteredLayers = filteredLayers.sort((a, b) => a - b);

    checkLayerBounds(mapConfig, filteredLayers);

    return filteredLayers;
};

const layerAliases = {
    all: true,
    mapnik: true,
    torque: true,
    http: true,
    plain: true
};

function defaultLayerFilter (layerFilter) {
    if (layerFilter === undefined) {
        return 'mapnik';
    }
    return layerFilter;
}

function resolveAlias (mapConfig, alias) {
    if (Number.isFinite(+alias)) {
        return [+alias];
    }

    if (alias === 'all') {
        return mapConfig.getLayers().map((_, i) => i);
    }

    if (!Object.prototype.hasOwnProperty.call(layerAliases, alias)) {
        throw new Error('Invalid layer filtering');
    }

    return mapConfig.getLayers().reduce((filteredLayers, _, index) => {
        if (mapConfig.layerType(index) === alias) {
            filteredLayers.push(index);
        }

        return filteredLayers;
    }, []);
}

function resolveIds (mapConfig, layerIds) {
    const layerIdsToNumber = layerIds.map(_ => +_);
    if (layerIdsToNumber.every(Number.isFinite)) {
        return layerIdsToNumber;
    }

    if (layerIdsToNumber.every(Number.isNaN)) {
        return layerIds.map(mapConfig.getIndexByLayerId.bind(mapConfig));
    }

    throw new Error('Invalid layer filtering');
}

function checkLayerBounds (mapConfig, filteredLayers) {
    const uppermostLayerIdx = filteredLayers[filteredLayers.length - 1];
    const lowestLayerIdx = filteredLayers[0];

    if (lowestLayerIdx < 0 || uppermostLayerIdx >= mapConfig.getLayers().length) {
        throw new Error('Invalid layer filtering');
    }
}

function resolveStringFilter (mapConfig, layerFilter) {
    if (isAlias(layerFilter)) {
        return resolveAlias(mapConfig, layerFilter);
    }

    return resolveIds(mapConfig, layerFilter.split(','));
}

function isAlias (layerFilter) {
    return Object.prototype.hasOwnProperty.call(layerAliases, layerFilter);
}
