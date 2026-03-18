import './App.css';
import Layout from './components/tree-menu/Layout';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import storage from 'redux-persist/lib/storage';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import thunk from 'redux-thunk';
import { geoLayerReducer } from './redux-store/reducers/geoLayerReducer';
import { getAssetUrl } from './utils/publicPath';

const rootReducers = combineReducers({
  geoJson: geoLayerReducer,
});

const persisterConfig = {
  key: 'naturerisk',
  storage,
  whitelist: []
};

const persistedReducer = persistReducer(persisterConfig, rootReducers);
const store = createStore(persistedReducer, applyMiddleware(thunk));
const persistor = persistStore(store);

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <>
          {/* <div id="title-bar">
            <img id="logo" src={getAssetUrl('static/images/icon/logo.png')} alt="Logo" />
            <div id="title-text">Nature Geospatial Insights</div>
          </div> */}
          {/* <div className="app-container"> */}
            <Layout />
          {/* </div> */}
        </>
      </PersistGate>
    </Provider>
  );
}

export default App;